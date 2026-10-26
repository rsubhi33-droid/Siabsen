class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Akses tidak diizinkan. Silakan login.') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Anda tidak memiliki hak akses untuk resource ini.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource tidak ditemukan.') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static internal(message = 'Terjadi kesalahan pada server.') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
