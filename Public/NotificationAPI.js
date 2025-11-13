import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Notification from './models/Notification.js';

const router = express.Router();

// Get all notifications for current user
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly } = req.query;

    const query = { RecipientUserID: userId };

    if (unreadOnly === 'true') {
      query.IsRead = false;
    }

    const notifications = await Notification.find(query);

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
});

// Get unread notification count
router.get('/notifications/unread/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Notification.countUnread(userId);

    res.status(200).json({
      message: 'Unread count retrieved successfully',
      unreadCount: count
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error counting unread notifications',
      error: error.message
    });
  }
});

// Mark a notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    // Verify user owns this notification
    if (notification.RecipientUserID !== userId) {
      return res.status(403).json({
        message: 'You can only mark your own notifications as read'
      });
    }

    if (notification.IsRead) {
      return res.status(400).json({
        message: 'Notification is already marked as read'
      });
    }

    const updatedNotification = await Notification.markAsRead(notificationId);

    res.status(200).json({
      message: 'Notification marked as read',
      data: updatedNotification
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Notification.markAllAsRead(userId);

    res.status(200).json({
      message: 'All notifications marked as read',
      markedCount: count
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
});

// Delete a notification
router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    // Verify user owns this notification
    if (notification.RecipientUserID !== userId) {
      return res.status(403).json({
        message: 'You can only delete your own notifications'
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
      message: 'Notification deleted successfully',
      data: {
        NotificationID: notificationId
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

// Delete old notifications (admin/maintenance)
router.delete('/notifications/cleanup/old', authenticateToken, async (req, res) => {
  try {
    const { daysOld } = req.query;
    const days = parseInt(daysOld) || 30;

    const count = await Notification.deleteOldNotifications(days);

    res.status(200).json({
      message: `Deleted notifications older than ${days} days`,
      deletedCount: count
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting old notifications',
      error: error.message
    });
  }
});

export default router;
