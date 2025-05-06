const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Service = require('../models/Service');
const authMiddleware = require('../middleware/auth');
const { processPayment } = require('../utils/paymentGateway');

router.post('/process', authMiddleware, async (req, res) => {
  const { serviceId, paymentMethod, amount } = req.body;

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (service.amount !== amount) return res.status(400).json({ message: 'Invalid amount' });

    const transaction = new Transaction({
      userId: req.user.id,
      serviceId,
      amount,
      paymentMethod,
      transactionId: `TXN_${Date.now()}`,
    });

    const paymentResult = await processPayment({ amount, paymentMethod, transactionId: transaction.transactionId });
    if (paymentResult.status === 'success') {
      transaction.status = 'completed';
      await transaction.save();
      res.json({ message: 'Payment successful', transaction });
    } else {
      transaction.status = 'failed';
      await transaction.save();
      res.status(400).json({ message: 'Payment failed', transaction });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error processing payment', error });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).populate('serviceId');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction history', error });
  }
});

module.exports = router;