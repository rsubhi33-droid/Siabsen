'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('absensi', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      kegiatan_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'kegiatan', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sesi_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'sesi_kegiatan', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      metode: {
        type: Sequelize.ENUM('qr_scan', 'manual'),
        allowNull: false,
        defaultValue: 'qr_scan',
      },
      waktu_checkin: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      status: {
        type: Sequelize.ENUM('hadir', 'terlambat', 'tidak_hadir'),
        defaultValue: 'hadir',
      },
      catatan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      verified_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
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

    // Unique constraint: 1 user hanya bisa absen 1x per sesi
    await queryInterface.addIndex('absensi', ['user_id', 'sesi_id'], {
      unique: true,
      name: 'unique_absensi_per_sesi',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('absensi');
  },
};
