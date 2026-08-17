import api from './api.js';

export const rentalRequestService = {
  // The backend resolves the caller's own id from the JWT and ignores the path
  // variable, so the id passed here is cosmetic (use 0).
  getByTenant() {
    return api.get('/rental-requests/tenant/0');
  },
  getByOwner() {
    return api.get('/rental-requests/owner/0');
  },
  create(propertyId) {
    return api.post('/rental-requests', { userId: 0, propertyId });
  },
  respond(requestId, decision, rejectionReason = null) {
    return api.put(`/rental-requests/${requestId}/respond`, {
      ownerId: 0,
      decision,
      rejectionReason,
    });
  },
};
