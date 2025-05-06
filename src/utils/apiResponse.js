class ApiResponse {
    static success(res, data, message = 'Success', statusCode = 200) {
      return res.status(statusCode).json({
        success: true,
        message,
        data
      });
    }
  
    static error(res, message = 'Error occurred', statusCode = 400, errors = null) {
      return res.status(statusCode).json({
        success: false,
        message,
        errors
      });
    }
  }
  
  class ApiError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = { ApiResponse, ApiError };