const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");

// @desc    Get unread notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(20); // Son 20 bildirimi getir

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.json({ notifications, unreadCount });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id, // Sadece kendi bildirimini okuyabilsin
  });

  if (notification) {
    notification.isRead = true;
    await notification.save();
    res.json({ message: "Bildirim okundu olarak işaretlendi." });
  } else {
    res.status(404);
    throw new Error("Bildirim bulunamadı.");
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );
  res.json({ message: "Tüm bildirimler okundu olarak işaretlendi." });
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
