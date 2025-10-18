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
    allowNull: true,
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of file attachments [{name, url, type, size, cloudinaryId}]'
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  // Reply functionality
  replyToMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'messages',
      key: 'id',
    },
    comment: 'ID of the message being replied to (for threaded conversations)'
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the message has been edited'
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the message was last edited'
  },
}, {
  tableName: 'messages',
  timestamps: true,
});

module.exports = Message;