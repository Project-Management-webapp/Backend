const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id',
    },
  },
  messageType: {
    type: DataTypes.ENUM('direct', 'project', 'task', 'announcement'),
    allowNull: false,
    defaultValue: 'direct',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  mentions: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true,
});

module.exports = Message;