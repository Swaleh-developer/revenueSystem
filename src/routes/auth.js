const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    // Your signup logic
    res.status(201).json({ token, user }); // Make sure to send response
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    // Your login logic
    res.json({ token, user }); // Make sure to send response
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Current User Route
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;