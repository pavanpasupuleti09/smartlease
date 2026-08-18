/**
 * Loads the Razorpay Checkout script once and opens a checkout session.
 * The key and order come from the backend (POST /api/payments/order), so no
 * credentials are hardcoded here.
 */
let scriptPromise = null;

function loadScript() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay failed to load')));
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout. Check your connection.'));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export function openRazorpayCheckout({
  key,
  order_id,
  amount,
  currency,
  name = 'SmartLease',
  description = 'Rent Payment',
}) {
  return loadScript().then(
    (Razorpay) =>
      new Promise((resolve, reject) => {
        const options = {
          key,
          order_id,
          amount, // already in paise
          currency,
          name,
          description,
          theme: { color: '#2563eb' },
          handler(response) {
            resolve(response);
          },
          modal: {
            ondismiss() {
              reject(new Error('Checkout closed without payment.'));
            },
          },
        };
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (response) => {
          const err = response?.error || {};
          reject(new Error(err.description || 'Payment failed. Please try again.'));
        });
        rzp.open();
      })
  );
}
