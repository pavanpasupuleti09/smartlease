import api from './api.js';

export const leaseService = {
  getAll() {
    return api.get('/leases');
  },
  getById(id) {
    return api.get(`/leases/${id}`);
  },
  create(payload) {
    return api.post('/leases', payload);
  },
  update(id, payload) {
    return api.put(`/leases/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/leases/${id}`);
  },
};
