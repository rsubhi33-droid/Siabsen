const { z } = require('zod');

const scanQrSchema = z.object({
  qr_token: z.string().min(1, 'QR token wajib diisi'),
});

const manualAbsensiSchema = z.object({
  user_id: z.number().int().positive('User ID wajib diisi'),
  sesi_id: z.number().int().positive('Sesi ID wajib diisi'),
  catatan: z.string().max(500).optional(),
});

module.exports = { scanQrSchema, manualAbsensiSchema };
