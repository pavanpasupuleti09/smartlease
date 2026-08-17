import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { leaseService } from '../services/leaseService.js';
import { rentService } from '../services/rentService.js';
import { maintenanceService } from '../services/maintenanceService.js';
import { paymentService } from '../services/paymentService.js';
import { rentalRequestService } from '../services/rentalRequestService.js';
import { propertyService } from '../services/propertyService.js';

/**
 * Loads everything a tenant needs: their active lease, property, rents,
 * payments, maintenance and rental requests — all from real backend APIs.
 */
export function useTenantData() {
  const { profile } = useAuth();
  const [data, setData] = useState({
    lease: null,
    property: null,
    rents: [],
    payments: [],
    maintenance: [],
    rentalRequests: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setData((d) => ({ ...d, loading: true, error: null }));
    try {
      const tenantId = profile?.tenantId;

      const [leasesRes, rentsRes, maintenanceRes, requestsRes] = await Promise.all([
        leaseService.getAll(),
        rentService.getAll(),
        maintenanceService.getAll(),
        rentalRequestService.getByTenant(),
      ]);

      const leases = leasesRes.data;
      const rents = rentsRes.data || [];
      const maintenance = maintenanceRes.data || [];
      const rentalRequests = requestsRes.data || [];

      // Active lease for this tenant (Tenant entity id matches profile.tenantId).
      const lease =
        leases.find(
          (l) => l.tenantId === tenantId && (l.status === 'ACTIVE' || l.status === 'EXPIRED')
        ) || leases.find((l) => l.tenantId === tenantId) || null;

      let property = null;
      let payments = [];
      if (lease) {
        const propertyRes = await propertyService.getById(lease.propertyId);
        property = propertyRes.data;
        try {
          const paymentsRes = await paymentService.getByLease(lease.id);
          payments = paymentsRes.data || [];
        } catch {
          payments = [];
        }
      }

      // Rents belonging to this tenant's lease (or any lease of this tenant).
      const tenantRents = rents.filter(
        (r) => r.leaseId === lease?.id || r.tenantId === tenantId
      );
      const tenantMaintenance = maintenance.filter((m) => m.tenantId === tenantId);

      setData({
        lease,
        property,
        rents: tenantRents,
        payments,
        maintenance: tenantMaintenance,
        rentalRequests,
        loading: false,
        error: null,
      });
    } catch (err) {
      setData((d) => ({ ...d, loading: false, error: err.message }));
    }
  }, [profile?.tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, refetch: load };
}
