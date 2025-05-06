const { body } = require('express-validator');

exports.signupValidation = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase, one lowercase, one number and one special character'),
  
  body('role')
    .isIn(['citizen', 'business', 'admin']).withMessage('Invalid role specified'),
  
  body('nationalId')
    .if(body('role').equals('citizen'))
    .notEmpty().withMessage('National ID is required for citizens')
    .isLength({ min: 8, max: 12 }).withMessage('National ID must be between 8-12 characters')
    .isNumeric().withMessage('National ID must contain only numbers'),
  
  body('businessRegNumber')
    .if(body('role').equals('business'))
    .notEmpty().withMessage('Business registration number is required for businesses')
    .isAlphanumeric().withMessage('Business registration number must be alphanumeric')
    .isLength({ min: 6, max: 15 }).withMessage('Business registration number must be between 6-15 characters')
];

exports.loginValidation = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];