import api from './api.js';

export const propertyService = {
  getAll() {
    return api.get('/properties');
  },
  getById(id) {
    return api.get(`/properties/${id}`);
  },
  // The backend resolves the caller's own id from the JWT and ignores the path
  // variable, so the id passed here is cosmetic (use 0).
  getByOwner() {
    return api.get('/properties/owner/0');
  },
  create(payload) {
    return api.post('/properties', payload);
  },
  update(id, payload) {
    return api.put(`/properties/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/properties/${id}`);
  },
};

export const propertyImageService = {
  getByProperty(propertyId) {
    return api.get(`/properties/${propertyId}/images`);
  },
  upload(propertyId, file, isPrimary = false) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', String(isPrimary));
    return api.post(`/properties/${propertyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove(imageId) {
    return api.delete(`/properties/images/${imageId}`);
  },
  setPrimary(imageId) {
    return api.put(`/properties/images/${imageId}/primary`);
  },
};
