import api from './api.js';

export const tenantService = {
  getAll() {
    return api.get('/tenants');
  },
  getById(id) {
    return api.get(`/tenants/${id}`);
  },
  create(payload) {
    return api.post('/tenants', payload);
  },
  update(id, payload) {
    return api.put(`/tenants/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/tenants/${id}`);
  },
};
