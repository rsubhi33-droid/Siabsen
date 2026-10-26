'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('laporan', {
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
      generated_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tipe: {
        type: Sequelize.ENUM('excel', 'pdf'),
        allowNull: false,
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      filepath: {
        type: Sequelize.STRING(500),
        allowNull: false,
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
    await queryInterface.dropTable('laporan');
  },
};
