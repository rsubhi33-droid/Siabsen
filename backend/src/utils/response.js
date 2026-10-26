/**
 * Format response JSON yang konsisten untuk seluruh API.
 */
const success = (res, { statusCode = 200, message = 'Berhasil', data = null, meta = null }) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const created = (res, { message = 'Data berhasil dibuat', data = null }) => {
  return success(res, { statusCode: 201, message, data });
};

const paginated = (res, { message = 'Berhasil', data, page, limit, totalItems }) => {
  const totalPages = Math.ceil(totalItems / limit);
  return success(res, {
    message,
    data,
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalItems,
      totalPages,
    },
  });
};

const error = (res, { statusCode = 500, message = 'Terjadi kesalahan', details = null }) => {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
};

module.exports = { success, created, paginated, error };
