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

    // Handle file attachments from Cloudinary upload
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        name: file.originalname,
        url: file.path, // Cloudinary URL
        type: file.mimetype,
        size: file.size,
        cloudinaryId: file.filename
      }));
    }

    const newMessage = await Message.create({
      content,
      senderId,
      projectId,
      attachments: attachments.length > 0 ? attachments : null,
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
      data: messageWithDetails,
      attachmentsCount: attachments.length
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
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'profileImage', 'position']
        },
        {
          model: Message,
          as: 'parentMessage',
          attributes: ['id', 'content', 'createdAt'],
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'fullName', 'profileImage']
            }
          ]
        },
        {
          model: Message,
          as: 'replies',
          attributes: ['id', 'content', 'senderId', 'createdAt'],
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'fullName', 'profileImage']
            }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Format messages with reply counts
    const formattedMessages = messages.map(message => {
      const messageData = message.toJSON();
      return {
        ...messageData,
        replyCount: messageData.replies ? messageData.replies.length : 0,
        hasReplies: messageData.replies && messageData.replies.length > 0,
        isReply: !!messageData.replyToMessageId
      };
    });

    res.status(200).json({
      success: true,
      message: "Project messages retrieved successfully",
      data: {
        project: {
          id: project.id,
          name: project.name
        },
        messages: formattedMessages,
        totalMessages: formattedMessages.length
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

// Reply to a specific message
const handleReplyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required"
      });
    }

    // Find the parent message
    const parentMessage = await Message.findOne({
      where: { id: messageId },
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
        }
      ]
    });

    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: "Parent message not found"
      });
    }

    // Handle file attachments from Cloudinary upload
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        name: file.originalname,
        url: file.path, // Cloudinary URL
        type: file.mimetype,
        size: file.size,
        cloudinaryId: file.filename
      }));
    }

    // Create the reply message
    const replyMessage = await Message.create({
      content,
      senderId,
      projectId: parentMessage.projectId,
      messageType: parentMessage.messageType,
      replyToMessageId: messageId,
      attachments: attachments.length > 0 ? attachments : null,
    });

    // Fetch the created reply with full details
    const replyWithDetails = await Message.findOne({
      where: { id: replyMessage.id },
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

    res.status(201).json({
      success: true,
      message: "Reply sent successfully",
      data: {
        reply: replyWithDetails,
        parentMessage: {
          id: parentMessage.id,
          content: parentMessage.content,
          sender: parentMessage.sender
        }
      },
      attachmentsCount: attachments.length
    });

  } catch (error) {
    console.error("Reply to message error:", error);
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
  handleDeleteMessage,
  handleReplyToMessage
};
