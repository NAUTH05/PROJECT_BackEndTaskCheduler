import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Notification from './models/Notification.js';
import ProjectMember from './models/ProjectMember.js';
const router = express.Router();
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

// POST /notifications/:id/respond — accept or decline a project invite
router.post('/notifications/:id/respond', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { action } = req.body; // 'accept' | 'decline'
    const userId = req.user.userId;
    if (!action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: "action must be 'accept' or 'decline'" });
    }
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.RecipientUserID !== userId) {
      return res.status(403).json({ message: 'Not your notification' });
    }
    if (notification.Type !== 'PROJECT_SHARED') {
      return res.status(400).json({ message: 'This notification does not require an action' });
    }
    if (notification.Status !== 'pending') {
      return res.status(400).json({ message: 'Already responded to this invite' });
    }
    // Update notification status via model's markAsRead-style update
    await Notification.markAsRead(notificationId);
    // Also update Status and ActionRequired
    const { db } = await import('../config/firebase.js');
    await db.collection('Notifications').doc(notificationId).update({
      Status: action === 'accept' ? 'accepted' : 'declined',
      ActionRequired: false
    });
    // If declined, remove from project
    if (action === 'decline') {
      await ProjectMember.deleteOne({
        ProjectID: notification.RelatedEntityID,
        UserID: userId
      });
    }
    res.status(200).json({
      message: action === 'accept' ? 'Đã chấp nhận lời mời' : 'Đã từ chối lời mời',
      action,
      projectId: notification.RelatedEntityID
    });
  } catch (error) {
    res.status(500).json({ message: 'Error responding to notification', error: error.message });
  }
});

export default router;
