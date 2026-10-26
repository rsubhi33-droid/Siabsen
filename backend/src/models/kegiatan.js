'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Kegiatan extends Model {
    static associate(models) {
      Kegiatan.belongsTo(models.User, { foreignKey: 'created_by', as: 'pembuat' });
      Kegiatan.belongsTo(models.MasterData, { foreignKey: 'kategori_id', as: 'kategori' });
      Kegiatan.hasMany(models.SesiKegiatan, { foreignKey: 'kegiatan_id', as: 'sesi' });
      Kegiatan.hasMany(models.Absensi, { foreignKey: 'kegiatan_id', as: 'absensi' });
    }
  }

  Kegiatan.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      nama: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      kategori_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'master_data', key: 'id' },
      },
      tanggal_mulai: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      tanggal_selesai: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      lokasi: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      kuota: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'aktif', 'selesai', 'batal'),
        defaultValue: 'draft',
      },
      created_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      sequelize,
      tableName: 'kegiatan',
      modelName: 'Kegiatan',
      underscored: true,
    }
  );

  return Kegiatan;
};
