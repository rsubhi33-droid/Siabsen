const rateLimit = require('express-rate-limit');

// 1. General API limiter (longgar untuk monitoring, polling, dan GET umum)
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 menit
  max: parseInt(process.env.RATE_LIMIT_API_MAX, 10) || 1000,                      // dinaikkan signifikan (default 1000)
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan coba lagi sebentar.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Auth limiter (ketat per IP untuk login / registrasi)
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 menit
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 20,                         // 20 percobaan
  message: {
    success: false,
    message: 'Terlalu banyak percobaan autentikasi dari perangkat ini. Silakan coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const scanKeyGenerator = (req) => {
  // req.user di-inject oleh middleware authenticate
  return req.user && req.user.id ? `user_${req.user.id}` : req.ip;
};

// 3. Scan limiter (keyed per user ID dari JWT, bukan per IP, agar tidak memblokir sesama user di WiFi acara)
const scanLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_SCAN_WINDOW_MS, 10) || 60 * 1000, // 1 menit
  max: parseInt(process.env.RATE_LIMIT_SCAN_MAX, 10) || 30,                   // 30 scan per menit per user
  keyGenerator: scanKeyGenerator,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan scan absensi untuk akun Anda. Silakan coba lagi sebentar.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, scanLimiter, scanKeyGenerator };
