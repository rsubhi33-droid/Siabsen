const ApiError = require('../utils/ApiError');

/**
 * Middleware: Validasi request body/query/params menggunakan Zod schema.
 * @param {Object} schema - Objek Zod schema
 * @param {'body'|'query'|'params'} source - Sumber data yang divalidasi
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(ApiError.badRequest('Validasi gagal.', errors));
    }
    req[source] = result.data;
    next();
  };
};

module.exports = validate;
