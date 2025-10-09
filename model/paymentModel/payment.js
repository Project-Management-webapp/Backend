const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paymentType: {
    type: DataTypes.ENUM('salary', 'bonus', 'project_payment', 'overtime'),
    allowNull: false,
    defaultValue: 'salary',
  },
  paymentMethod: {
    type: DataTypes.ENUM('bank_transfer', 'cash', 'check', 'digital_wallet'),
    allowNull: false,
    defaultValue: 'bank_transfer',
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
});

module.exports = Payment;