import api from './api.js';

export const rentService = {
  getAll() {
    return api.get('/rents');
  },
  getById(id) {
    return api.get(`/rents/${id}`);
  },
  create(payload) {
    return api.post('/rents', payload);
  },
  update(id, payload) {
    return api.put(`/rents/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/rents/${id}`);
  },
};
