const app = require('./app');
const { testConnection } = require('./config/database');
const initTutupSesiOtomatis = require('./jobs/tutupSesiOtomatis');

const PORT = process.env.PORT || 8000;

const start = async () => {
  // Verifikasi JWT_SECRET wajib ada demi keamanan sistem
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    console.error('❌ FATAL: JWT_SECRET tidak boleh kosong. Harap atur JWT_SECRET di environment variable.');
    process.exit(1);
  }

  // Test DB connection
  await testConnection();

  // Inisialisasi background cron job jika bukan di environment testing
  if (process.env.NODE_ENV !== 'test') {
    initTutupSesiOtomatis();
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 SIABSEN Backend running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || 'siabsen'}\n`);
  });
};

start();
