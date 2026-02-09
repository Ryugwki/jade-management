import { Notification } from "../models/Notification.js";

const toNotificationResponse = (notification) => ({
  id: notification._id.toString(),
  title: notification.title,
  message: notification.message,
  type: notification.type,
  sourceId: notification.sourceId,
  role: notification.role,
  userId: notification.userId,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
});

const buildNotificationFilter = (user) => {
  if (user?.role === "SUPER_ADMIN") {
    return { $or: [{ role: "SUPER_ADMIN" }, { userId: user.id }] };
  }
  return { userId: user?.id || "" };
};

export async function listNotifications(req, res) {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const filter = buildNotificationFilter(req.user);
  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit).exec(),
    Notification.countDocuments({ ...filter, readAt: { $exists: false } }).exec(),
  ]);

  return res.json({
    notifications: notifications.map(toNotificationResponse),
    unreadCount,
  });
}

export async function markNotificationRead(req, res) {
  const { id } = req.params || {};
  if (!id) {
    return res.status(400).json({ message: "Notification id required" });
  }

  const notification = await Notification.findById(id).exec();
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  const canRead =
    notification.userId === req.user?.id ||
    (req.user?.role === "SUPER_ADMIN" && notification.role === "SUPER_ADMIN");
  if (!canRead) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  return res.json({ notification: toNotificationResponse(notification) });
}

export async function markAllNotificationsRead(req, res) {
  const filter = buildNotificationFilter(req.user);
  await Notification.updateMany(
    { ...filter, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  ).exec();

  return res.json({ message: "Notifications marked as read" });
}
