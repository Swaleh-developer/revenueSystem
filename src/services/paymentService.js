const Transaction = require('../models/Transaction');
const Service = require('../models/Service');
const { processPayment } = require('../utils/paymentGateway');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

exports.processPayment = async (userId, serviceId, paymentMethod, amount) => {
  try {
    // Verify service exists and amount matches
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new ApiError('Service not found', 404);
    }

    if (service.amount !== amount) {
      throw new ApiError('Invalid payment amount', 400);
    }

    // Create transaction record
    const transaction = new Transaction({
      userId,
      serviceId,
      amount,
      paymentMethod,
      transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    });

    // Process payment with gateway
    const paymentResult = await processPayment({
      amount,
      paymentMethod,
      transactionId: transaction.transactionId
    });

    // Update transaction status based on payment result
    if (paymentResult.status === 'success') {
      transaction.status = 'completed';
      await transaction.save();
      return transaction;
    } else {
      transaction.status = 'failed';
      await transaction.save();
      throw new ApiError('Payment processing failed', 400);
    }
  } catch (error) {
    logger.error(`Payment processing error: ${error.message}`);
    throw error;
  }
};

exports.getUserTransactions = async (userId) => {
  try {
    return await Transaction.find({ userId })
      .populate('serviceId', 'name description amount category')
      .sort({ createdAt: -1 });
  } catch (error) {
    logger.error(`Error fetching transactions: ${error.message}`);
    throw error;
  }
};