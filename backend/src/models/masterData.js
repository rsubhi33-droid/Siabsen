'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class MasterData extends Model {
    static associate(models) {
      MasterData.hasMany(models.Kegiatan, { foreignKey: 'kategori_id', as: 'kegiatan' });
    }
  }

  MasterData.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      tipe: {
        type: DataTypes.ENUM('kategori_kegiatan', 'prodi', 'fakultas'),
        allowNull: false,
      },
      nama: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      kode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'master_data',
      modelName: 'MasterData',
      underscored: true,
    }
  );

  return MasterData;
};
