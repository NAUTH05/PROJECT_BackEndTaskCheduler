import { nanoid } from 'nanoid';
import { db } from '../../config/firebase.js';

const tasksCollection = db.collection('Tasks');

class Task {
  constructor(data) {
    this.TaskID = data.TaskID || nanoid(8);
    this.ProjectID = data.ProjectID;
    this.TaskName = data.TaskName;
    this.TaskDescription = data.TaskDescription;
    this.DueDate = data.DueDate;
    this.Priority = data.Priority || 'Medium';
    this.Status = data.Status || 'Backlog';
    this.AssignedToUserID = data.AssignedToUserID || null;
  }

  static getValidStatuses() {
    return ['Backlog', 'To Do', 'In Progress', 'In Review', 'Testing', 'Blocked', 'Completed', 'Cancelled'];
  }

  static getValidPriorities() {
    return ['Low', 'Medium', 'High', 'Urgent'];
  }

  async save() {
    const taskData = {
      TaskID: this.TaskID,
      ProjectID: this.ProjectID,
      TaskName: this.TaskName,
      TaskDescription: this.TaskDescription,
      DueDate: this.DueDate,
      Priority: this.Priority,
      Status: this.Status,
      AssignedToUserID: this.AssignedToUserID,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await tasksCollection.doc(this.TaskID).set(taskData);
    return this;
  }

  static async find(query = {}) {
    let queryRef = tasksCollection;

    if (query.ProjectID) {
      queryRef = queryRef.where('ProjectID', '==', query.ProjectID);
    }

    if (query.AssignedToUserID) {
      queryRef = queryRef.where('AssignedToUserID', '==', query.AssignedToUserID);
    }

    if (query.Status) {
      queryRef = queryRef.where('Status', '==', query.Status);
    }

    if (query.Priority) {
      queryRef = queryRef.where('Priority', '==', query.Priority);
    }

    const snapshot = query.ProjectID || query.AssignedToUserID || query.Status || query.Priority
      ? await queryRef.get()
      : await queryRef.orderBy('createdAt', 'desc').get();

    const tasks = [];
    snapshot.forEach(doc => {
      tasks.push(doc.data());
    });

    if (query.ProjectID || query.AssignedToUserID || query.Status || query.Priority) {
      tasks.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });
    }

    return tasks;
  }

  static async findOne(query) {
    const { TaskID, TaskName, ProjectID } = query;

    let queryRef = tasksCollection;

    if (TaskID) {
      queryRef = queryRef.where('TaskID', '==', TaskID);
    }

    if (TaskName) {
      queryRef = queryRef.where('TaskName', '==', TaskName);
    }

    if (ProjectID) {
      queryRef = queryRef.where('ProjectID', '==', ProjectID);
    }

    const snapshot = await queryRef.limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }

  static async findById(id) {
    const doc = await tasksCollection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  }

  static async findByIdAndDelete(id) {
    await tasksCollection.doc(id).delete();
    return { TaskID: id };
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const docRef = tasksCollection.doc(id);

    updateData.updatedAt = new Date();

    await docRef.update(updateData);

    if (options.new) {
      const doc = await docRef.get();
      return doc.data();
    }

    return { TaskID: id, ...updateData };
  }
}

export default Task;
