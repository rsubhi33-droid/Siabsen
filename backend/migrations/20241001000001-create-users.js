'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      nama: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      nim: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      prodi: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      angkatan: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      no_hp: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('mahasiswa', 'panitia', 'admin', 'dosen'),
        allowNull: false,
        defaultValue: 'mahasiswa',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
