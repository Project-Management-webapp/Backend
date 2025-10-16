const Message = require('../../model/messageModel/message');
const User = require('../../model/userModel/user');
const Project = require('../../model/projectModel/project');
const { Op } = require('sequelize');

const handleSendMessage = async (req, res) => {
  try {
    const {
      content,
      projectId,
    } = req.body;

    const senderId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message content is required"
      });
    }



    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required for project messages"
      });
    }

    const newMessage = await Message.create({
      content,
      senderId,
      projectId,
    });

    const messageWithDetails = await Message.findOne({
      where: { id: newMessage.id },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'profileImage']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
      ]
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: messageWithDetails
    });

  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleGetMessages = async (req, res) => {
  try {
    const {  
      projectId, 
    } = req.query;

    const userId = req.user.id;
    const whereConditions = {};

    if (projectId) {
      whereConditions.projectId = projectId;
    }

    // If no specific filter, show direct messages to/from user
    if (!projectId && !taskId && !messageType) {
      whereConditions[Op.or] = [
        { senderId: userId },
        { receiverId: userId }
      ];
    }


    const  messages  = await Message.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'profileImage', 'position']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
    
      ],

      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      data: {
        messages,
        totalCount: messages.count
      }
    });

  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get conversation between two users
const handleGetConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ],
        messageType: 'direct'
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'profileImage']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fullName', 'email', 'profileImage']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      data: messages
    });

  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get project messages
const handleGetProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const messages = await Message.findAll({
      where: { 
        projectId,
        messageType: 'project'
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'profileImage', 'position']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: "Project messages retrieved successfully",
      data: {
        project: {
          id: project.id,
          name: project.name
        },
        messages
      }
    });

  } catch (error) {
    console.error("Get project messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update/Edit message
const handleUpdateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Message content is required"
      });
    }

    const message = await Message.findByPk(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Only sender can edit their own message
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages"
      });
    }

    // Update the message content and set isEdited flag
    await message.update({
      content: content.trim(),
      isEdited: true
    });

    // Fetch updated message with details
    const updatedMessage = await Message.findOne({
      where: { id: messageId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'profileImage', 'position']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: updatedMessage
    });

  } catch (error) {
    console.error("Update message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete message
const handleDeleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findByPk(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Only sender can delete their own message
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages"
      });
    }

    await message.destroy();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });

  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  handleSendMessage,
  handleGetProjectMessages,
  handleUpdateMessage,
  handleDeleteMessage
};
