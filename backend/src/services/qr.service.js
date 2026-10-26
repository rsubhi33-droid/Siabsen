const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const QR_SECRET = process.env.QR_SECRET || 'default_qr_secret';
const QR_TOKEN_TTL = parseInt(process.env.QR_TOKEN_TTL, 10) || 60; // detik

/**
 * Generate QR token unik untuk sesi kegiatan.
 * Token berisi informasi sesi + HMAC signature + timestamp.
 */
const generateQrToken = (sesiId) => {
  const timestamp = Date.now();
  const payload = `${sesiId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex').slice(0, 16);
  return `${payload}:${signature}`;
};

/**
 * Verifikasi QR token: cek format, signature, dan expiry.
 */
const verifyQrToken = (token) => {
  const parts = token.split(':');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Format QR tidak valid.' };
  }

  const [sesiId, timestamp, signature] = parts;
  const payload = `${sesiId}:${timestamp}`;
  const expectedSig = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex').slice(0, 16);

  if (signature !== expectedSig) {
    return { valid: false, reason: 'QR code tidak valid (signature mismatch).' };
  }

  const elapsed = (Date.now() - parseInt(timestamp, 10)) / 1000;
  if (elapsed > QR_TOKEN_TTL) {
    return { valid: false, reason: 'QR code sudah kadaluarsa. Minta panitia generate ulang.' };
  }

  return { valid: true, sesiId: parseInt(sesiId, 10) };
};

/**
 * Generate QR Code image (base64 data URL).
 */
const generateQrImage = async (token) => {
  return QRCode.toDataURL(token, {
    width: 400,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });
};

module.exports = { generateQrToken, verifyQrToken, generateQrImage };
