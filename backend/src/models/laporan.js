'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Laporan extends Model {
    static associate(models) {
      Laporan.belongsTo(models.Kegiatan, { foreignKey: 'kegiatan_id', as: 'kegiatan' });
      Laporan.belongsTo(models.User, { foreignKey: 'generated_by', as: 'generator' });
    }
  }

  Laporan.init(
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
      generated_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      tipe: {
        type: DataTypes.ENUM('excel', 'pdf'),
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      filepath: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'laporan',
      modelName: 'Laporan',
      underscored: true,
    }
  );

  return Laporan;
};
