const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Store = sequelize.define(
  'Store',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
      },
    },
    address: {
      type: DataTypes.STRING(400),
      allowNull: false,
    },
    // Owner is optional at creation time but typically links to a STORE_OWNER user.
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'owner_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'stores',
    timestamps: true,
  }
);

module.exports = Store;
