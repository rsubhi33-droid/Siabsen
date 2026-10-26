'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('kegiatan', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      nama: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      kategori_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'master_data', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tanggal_mulai: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      tanggal_selesai: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      lokasi: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      kuota: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'aktif', 'selesai', 'batal'),
        defaultValue: 'draft',
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
    await queryInterface.dropTable('kegiatan');
  },
};
