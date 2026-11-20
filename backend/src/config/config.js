require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'siabsen',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME ? `${process.env.DB_NAME}_test` : 'siabsen_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },
  bridge_sso: {
    enabled: process.env.BRIDGE_SSO_ENABLED !== 'false',
    baseUrl: (process.env.BRIDGE_SSO_BASE_URL || 'https://bridge.uinssc.ac.id').replace(/\/+$/, ''),
    timeout: parseInt(process.env.BRIDGE_SSO_TIMEOUT, 10) || 8,
    simulate: process.env.BRIDGE_SSO_SIMULATE === 'true',
  },
};
