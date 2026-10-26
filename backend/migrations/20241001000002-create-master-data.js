'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_data', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      tipe: {
        type: Sequelize.ENUM('kategori_kegiatan', 'prodi', 'fakultas'),
        allowNull: false,
      },
      nama: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kode: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.dropTable('master_data');
  },
};
