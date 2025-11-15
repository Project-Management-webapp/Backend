const Notification = require('../../model/notificationModel/notification');
const User = require('../../model/userModel/user');
const { Op } = require('sequelize');

// Get all notifications for current user
const handleGetMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      type, 
    } = req.query;

    // Build where conditions - only get notifications for this specific user
    let whereConditions = { userId };

    if (type) whereConditions.type = type;

    const notifications = await Notification.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: {
        notifications,
      }
    });

  } catch (error) {
    console.error("Get my notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



// Delete notification
const handleDeleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Only the owner of the notification can delete it
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this notification"
      });
    }

    await notification.destroy();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });

  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  handleGetMyNotifications,
  handleDeleteNotification,
};
