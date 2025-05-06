// Mock payment gateway integration (replace with real API like M-Pesa)
const processPayment = async ({ amount, paymentMethod, transactionId }) => {
    // Simulate payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          transactionId,
          amount,
          paymentMethod,
        });
      }, 1000);
    });
  };
  
  module.exports = { processPayment };