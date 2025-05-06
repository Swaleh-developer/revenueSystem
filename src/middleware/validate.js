const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return ApiResponse.error(
      res,
      'Validation errors',
      422,
      errors.array()
    );
  };
};