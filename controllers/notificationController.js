const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const query = {
      $or: [
        { userId: req.user.id },
        { role: req.user.role },
        { role: 'all' }
      ]
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
       return res.status(404).json({ success: false, message: 'Not found' });
    }

    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const query = {
      $or: [
        { userId: req.user.id },
        { role: req.user.role },
        { role: 'all' }
      ],
      isRead: false
    };

    await Notification.updateMany(query, { isRead: true });
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Internal utility function to create notification dynamically within controllers
exports.createNotification = async ({ userId, role, title, message, type, link }) => {
  try {
    await Notification.create({
      userId,
      role,
      title,
      message,
      type,
      link
    });
  } catch (error) {
    console.error('Failed to create notification', error);
  }
};
