const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const authService = require('../services/authService');

exports.signup = async (req, res, next) => {
  try {
    const { email, password, role, nationalId, businessRegNumber } = req.body;
    
    const user = await authService.signup({
      email,
      password,
      role,
      nationalId,
      businessRegNumber
    });

    const token = authService.generateToken(user);
    
    return ApiResponse.success(res, {
      token,
      user: user.toAuthJSON()
    }, 'User created successfully', 201);
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await authService.login(email, password);
    const token = authService.generateToken(user);
    
    return ApiResponse.success(res, {
      token,
      user: user.toAuthJSON()
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }
    
    return ApiResponse.success(res, user.toAuthJSON());
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);
    next(error);
  }
};