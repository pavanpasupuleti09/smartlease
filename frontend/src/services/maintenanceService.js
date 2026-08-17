import api from './api.js';

export const maintenanceService = {
  getAll() {
    return api.get('/maintenance');
  },
  getById(id) {
    return api.get(`/maintenance/${id}`);
  },
  create(payload) {
    return api.post('/maintenance', payload);
  },
  update(id, payload) {
    return api.put(`/maintenance/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/maintenance/${id}`);
  },
};
