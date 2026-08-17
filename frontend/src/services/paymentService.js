import api from './api.js';

export const paymentService = {
  createOrder(leaseId, paymentType) {
    return api.post('/payments/order', { leaseId, paymentType });
  },
  verifyPayment(payload) {
    // The backend accepts both snake_case (razorpay_order_id) and camelCase.
    return api.post('/payments/verify', payload);
  },
  getByLease(leaseId) {
    return api.get(`/payments/lease/${leaseId}`);
  },
};
