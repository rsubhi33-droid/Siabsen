'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sesi_kegiatan', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      kegiatan_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'kegiatan', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nama_sesi: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      tanggal: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      jam_mulai: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      jam_selesai: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      qr_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      qr_generated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_open: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable('sesi_kegiatan');
  },
};
