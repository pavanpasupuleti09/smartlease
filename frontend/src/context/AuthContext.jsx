import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService.js';
import { tenantService } from '../services/tenantService.js';
import { propertyService } from '../services/propertyService.js';
import { decodeJwt } from '../utils/format.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'sl_token';
const PROFILE_KEY = 'sl_profile';

/**
 * The backend JWT carries only the email (subject) and there is no /me endpoint,
 * so we resolve the caller's identity from real APIs:
 *  1. tenants table lookup by email          -> TENANT (+ tenantId)
 *  2. properties owned by the caller         -> OWNER (+ ownerId)
 *  3. otherwise, fall back to the role chosen at registration (if any)
 *  4. last resort                           -> ADMIN (no public signal)
 */
async function resolveProfile(token) {
  const payload = decodeJwt(token);
  const email = payload.sub || '';
  const roleHint = localStorage.getItem('sl_role_hint') || null;

  const tenants = (await tenantService.getAll()).data;
  const tenantRow = tenants.find(
    (t) => t.email && t.email.toLowerCase() === email.toLowerCase()
  );
  if (tenantRow) {
    return {
      email,
      fullName: tenantRow.fullName || email,
      role: 'TENANT',
      tenantId: tenantRow.id,
      ownerId: null,
    };
  }

  const props = (await propertyService.getByOwner()).data;
  if (Array.isArray(props) && props.length > 0) {
    const first = props[0];
    return {
      email,
      fullName: first.ownerName || email,
      role: 'OWNER',
      tenantId: null,
      ownerId: first.ownerId,
    };
  }

  // A brand-new OWNER who has no properties yet produces no API signal, so
  // prefer the role they chose at registration when available.
  if (roleHint === 'TENANT' || roleHint === 'OWNER') {
    return { email, fullName: email, role: roleHint, tenantId: null, ownerId: null };
  }

  return { email, fullName: email, role: 'ADMIN', tenantId: null, ownerId: null };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [error, setError] = useState(null);

  // On refresh with a stored token but no stored profile, re-resolve it.
  useEffect(() => {
    let cancelled = false;
    if (token && !profile) {
      resolveProfile(token)
        .then((p) => {
          if (cancelled) return;
          setProfile(p);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
        })
        .catch(() => {
          if (cancelled) return;
          setProfile({ email: '', fullName: '', role: null });
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [token, profile]);

  const login = useCallback(async (email, password) => {
    setError(null);
    const res = await authService.login({ email, password });
    const newToken = res.data.token;
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);

    let resolved;
    try {
      resolved = await resolveProfile(newToken);
    } catch {
      resolved = { email, fullName: email, role: null, tenantId: null, ownerId: null };
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(resolved));
    setProfile(resolved);
    return resolved;
  }, []);

  const register = useCallback(
    async (payload) => {
      // Remember the self-chosen role: the backend JWT has no role claim and a
      // new OWNER without properties is otherwise indistinguishable from ADMIN.
      if (payload.role === 'TENANT' || payload.role === 'OWNER') {
        localStorage.setItem('sl_role_hint', payload.role);
      }
      return authService.register(payload);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem('sl_role_hint');
    setToken(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      profile,
      isAuthenticated: Boolean(token),
      role: profile?.role || null,
      loading,
      error,
      login,
      register,
      logout,
    }),
    [token, profile, loading, error, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
