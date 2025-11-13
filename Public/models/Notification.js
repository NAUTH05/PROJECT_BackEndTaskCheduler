import { nanoid } from 'nanoid';
import { db } from '../../config/firebase.js';

class Notification {
  constructor(data) {
    this.NotificationID = data.NotificationID || nanoid(8);
    this.Type = data.Type; // TASK_ASSIGNED, PROJECT_SHARED, COMMENT_ADDED, etc.
    this.Title = data.Title;
    this.Message = data.Message;
    this.IsRead = data.IsRead || false;
    this.CreatedAt = data.CreatedAt || new Date().toISOString();
    this.RecipientUserID = data.RecipientUserID; // Who receives this notification
    this.RelatedEntityID = data.RelatedEntityID || null; // TaskID, ProjectID, CommentID, etc.
    this.RelatedEntityType = data.RelatedEntityType || null; // 'task', 'project', 'comment'
    this.ActionByUserID = data.ActionByUserID || null; // Who performed the action
    this.ActionByUserName = data.ActionByUserName || null;
  }

  async save() {
    const notificationRef = db.collection('Notifications').doc(this.NotificationID);
    await notificationRef.set({
      NotificationID: this.NotificationID,
      Type: this.Type,
      Title: this.Title,
      Message: this.Message,
      IsRead: this.IsRead,
      CreatedAt: this.CreatedAt,
      RecipientUserID: this.RecipientUserID,
      RelatedEntityID: this.RelatedEntityID,
      RelatedEntityType: this.RelatedEntityType,
      ActionByUserID: this.ActionByUserID,
      ActionByUserName: this.ActionByUserName
    });
    return this;
  }

  static async find(query = {}) {
    let notificationsRef = db.collection('Notifications');

    if (query.RecipientUserID) {
      notificationsRef = notificationsRef.where('RecipientUserID', '==', query.RecipientUserID);
    }
    if (query.IsRead !== undefined) {
      notificationsRef = notificationsRef.where('IsRead', '==', query.IsRead);
    }
    if (query.Type) {
      notificationsRef = notificationsRef.where('Type', '==', query.Type);
    }

    const snapshot = await notificationsRef.get();
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      return new Notification(data);
    });

    // Sort by CreatedAt descending (newest first)
    return notifications.sort((a, b) => {
      return new Date(b.CreatedAt) - new Date(a.CreatedAt);
    });
  }

  static async findById(notificationId) {
    const notificationRef = db.collection('Notifications').doc(notificationId);
    const doc = await notificationRef.get();

    if (!doc.exists) {
      return null;
    }

    return new Notification(doc.data());
  }

  static async markAsRead(notificationId) {
    const notificationRef = db.collection('Notifications').doc(notificationId);
    const doc = await notificationRef.get();

    if (!doc.exists) {
      return null;
    }

    await notificationRef.update({
      IsRead: true,
      ReadAt: new Date().toISOString()
    });

    const updatedDoc = await notificationRef.get();
    return new Notification(updatedDoc.data());
  }

  static async markAllAsRead(userId) {
    const notificationsRef = db.collection('Notifications');
    const snapshot = await notificationsRef
      .where('RecipientUserID', '==', userId)
      .where('IsRead', '==', false)
      .get();

    const batch = db.batch();
    const readAt = new Date().toISOString();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        IsRead: true,
        ReadAt: readAt
      });
    });

    await batch.commit();
    return snapshot.size;
  }

  static async countUnread(userId) {
    const notificationsRef = db.collection('Notifications');
    const snapshot = await notificationsRef
      .where('RecipientUserID', '==', userId)
      .where('IsRead', '==', false)
      .get();

    return snapshot.size;
  }

  static async findByIdAndDelete(notificationId) {
    const notificationRef = db.collection('Notifications').doc(notificationId);
    const doc = await notificationRef.get();

    if (!doc.exists) {
      return null;
    }

    const notification = new Notification(doc.data());
    await notificationRef.delete();
    return notification;
  }

  static async deleteOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();

    const notificationsRef = db.collection('Notifications');
    const snapshot = await notificationsRef
      .where('CreatedAt', '<', cutoffISO)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }
}

export default Notification;
