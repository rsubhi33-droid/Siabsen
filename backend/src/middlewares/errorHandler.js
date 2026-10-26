const ApiError = require('../utils/ApiError');
const { error } = require('../utils/response');

/**
 * Global error handler middleware.
 */
const errorHandler = (err, req, res, _next) => {
  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return error(res, {
      statusCode: 400,
      message: 'Validasi gagal.',
      details: messages,
    });
  }

  // Our custom ApiError
  if (err instanceof ApiError) {
    return error(res, {
      statusCode: err.statusCode,
      message: err.message,
      details: err.details,
    });
  }

  // Unknown / unhandled error
  return error(res, {
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan pada server.' : err.message,
  });
};

module.exports = errorHandler;
