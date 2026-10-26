'use strict';

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

const db = {};
const modelsDir = __dirname;

// Auto-load all model files in this directory
fs.readdirSync(modelsDir)
  .filter((file) => file !== 'index.js' && file.endsWith('.js') && !file.startsWith('.'))
  .forEach((file) => {
    const modelFactory = require(path.join(modelsDir, file));
    const model = modelFactory(sequelize);
    db[model.name] = model;
  });

// Set up associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

module.exports = db;
