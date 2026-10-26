const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 8000;

const start = async () => {
  // Test DB connection
  await testConnection();

  app.listen(PORT, () => {
    console.log(`\n🚀 SIABSEN Backend running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || 'siabsen'}\n`);
  });
};

start();
