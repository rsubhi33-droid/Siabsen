'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Absensi extends Model {
    static associate(models) {
      Absensi.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Absensi.belongsTo(models.Kegiatan, { foreignKey: 'kegiatan_id', as: 'kegiatan' });
      Absensi.belongsTo(models.SesiKegiatan, { foreignKey: 'sesi_id', as: 'sesi' });
    }
  }

  Absensi.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      kegiatan_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'kegiatan', key: 'id' },
      },
      sesi_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'sesi_kegiatan', key: 'id' },
      },
      metode: {
        type: DataTypes.ENUM('qr_scan', 'manual'),
        allowNull: false,
        defaultValue: 'qr_scan',
      },
      waktu_checkin: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM('hadir', 'terlambat', 'tidak_hadir'),
        defaultValue: 'hadir',
      },
      catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      verified_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'absensi',
      modelName: 'Absensi',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'sesi_id'],
          name: 'unique_absensi_per_sesi',
        },
      ],
    }
  );

  return Absensi;
};
