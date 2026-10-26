'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SesiKegiatan extends Model {
    static associate(models) {
      SesiKegiatan.belongsTo(models.Kegiatan, { foreignKey: 'kegiatan_id', as: 'kegiatan' });
      SesiKegiatan.hasMany(models.Absensi, { foreignKey: 'sesi_id', as: 'absensi' });
    }
  }

  SesiKegiatan.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      kegiatan_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'kegiatan', key: 'id' },
      },
      nama_sesi: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      jam_mulai: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      jam_selesai: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      qr_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      qr_generated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_open: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'sesi_kegiatan',
      modelName: 'SesiKegiatan',
      underscored: true,
    }
  );

  return SesiKegiatan;
};
