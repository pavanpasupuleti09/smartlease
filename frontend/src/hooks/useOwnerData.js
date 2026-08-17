import { useCallback, useEffect, useState } from 'react';
import { propertyService } from '../services/propertyService.js';
import { leaseService } from '../services/leaseService.js';
import { rentService } from '../services/rentService.js';
import { maintenanceService } from '../services/maintenanceService.js';
import { rentalRequestService } from '../services/rentalRequestService.js';
import { tenantService } from '../services/tenantService.js';

/**
 * Loads everything an owner needs: their properties, leases/tenants on those
 * properties, rents, maintenance and rental requests — all from real APIs.
 */
export function useOwnerData() {
  const [data, setData] = useState({
    properties: [],
    leases: [],
    tenants: [],
    rents: [],
    maintenance: [],
    rentalRequests: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setData((d) => ({ ...d, loading: true, error: null }));
    try {
      const [propsRes, leasesRes, rentsRes, maintenanceRes, requestsRes, tenantsRes] =
        await Promise.all([
          propertyService.getByOwner(),
          leaseService.getAll(),
          rentService.getAll(),
          maintenanceService.getAll(),
          rentalRequestService.getByOwner(),
          tenantService.getAll(),
        ]);

      const properties = propsRes.data || [];
      const leases = leasesRes.data || [];
      const rents = rentsRes.data || [];
      const maintenance = maintenanceRes.data || [];
      const rentalRequests = requestsRes.data || [];
      const tenants = tenantsRes.data || [];

      const propertyIds = new Set(properties.map((p) => p.id));
      const leaseIds = new Set(
        leases.filter((l) => propertyIds.has(l.propertyId)).map((l) => l.id)
      );

      const ownerLeases = leases.filter((l) => propertyIds.has(l.propertyId));
      const ownerRents = rents.filter((r) => leaseIds.has(r.leaseId));
      const ownerMaintenance = maintenance.filter((m) => propertyIds.has(m.propertyId));

      const leaseTenantIds = new Set(ownerLeases.map((l) => l.tenantId));
      const ownerTenants = tenants.filter((t) => leaseTenantIds.has(t.id));

      setData({
        properties,
        leases: ownerLeases,
        tenants: ownerTenants,
        rents: ownerRents,
        maintenance: ownerMaintenance,
        rentalRequests,
        loading: false,
        error: null,
      });
    } catch (err) {
      setData((d) => ({ ...d, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, refetch: load };
}
