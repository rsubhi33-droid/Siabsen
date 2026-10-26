'use strict';
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Absensi, { foreignKey: 'user_id', as: 'absensi' });
      User.hasMany(models.Kegiatan, { foreignKey: 'created_by', as: 'kegiatanDibuat' });
    }

    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }

    toSafeJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      nama: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      nim: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      prodi: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      angkatan: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      no_hp: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('mahasiswa', 'panitia', 'admin', 'dosen'),
        allowNull: false,
        defaultValue: 'mahasiswa',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'users',
      modelName: 'User',
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
      },
    }
  );

  return User;
};
