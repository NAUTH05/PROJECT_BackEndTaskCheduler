import { nanoid } from 'nanoid';
import { db } from '../../config/firebase.js';

const activityLogsCollection = db.collection('ActivityLogs');

class ActivityLog {
  constructor(data) {
    this.LogID = data.LogID || nanoid(8);
    this.ProjectID = data.ProjectID;
    this.UserID = data.UserID;
    this.UserName = data.UserName || '';
    this.Action = data.Action;       // e.g. 'TASK_CREATED', 'COMMENT_ADDED', 'MEMBER_ADDED'
    this.Details = data.Details || ''; // human-readable description
    this.EntityType = data.EntityType || null; // 'task', 'comment', 'member', 'project'
    this.EntityID = data.EntityID || null;
    this.CreatedAt = data.CreatedAt || new Date().toISOString();
  }

  async save() {
    const logData = {
      LogID: this.LogID,
      ProjectID: this.ProjectID,
      UserID: this.UserID,
      UserName: this.UserName,
      Action: this.Action,
      Details: this.Details,
      EntityType: this.EntityType,
      EntityID: this.EntityID,
      CreatedAt: this.CreatedAt,
    };
    await activityLogsCollection.doc(this.LogID).set(logData);
    return this;
  }

  static async findByProject(projectId, limit = 50) {
    const snapshot = await activityLogsCollection
      .where('ProjectID', '==', projectId)
      .get();
    const logs = [];
    snapshot.forEach(doc => logs.push(doc.data()));
    // Sort by CreatedAt descending (newest first) in JS to avoid Firestore composite index
    logs.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    return logs.slice(0, limit);
  }
}

export default ActivityLog;
