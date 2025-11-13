import { nanoid } from 'nanoid';
import { db } from '../../config/firebase.js';

const taskAssignmentsCollection = db.collection('TaskAssignments');

class TaskAssignment {
  constructor(data) {
    this.AssignmentID = data.AssignmentID || nanoid(8);
    this.TaskID = data.TaskID;
    this.UserID = data.UserID;
    this.AssignedAt = data.AssignedAt || new Date();
    this.AssignedBy = data.AssignedBy; // UserID của người assign
  }

  async save() {
    const assignmentData = {
      AssignmentID: this.AssignmentID,
      TaskID: this.TaskID,
      UserID: this.UserID,
      AssignedAt: this.AssignedAt,
      AssignedBy: this.AssignedBy
    };

    await taskAssignmentsCollection.doc(this.AssignmentID).set(assignmentData);
    return this;
  }

  static async find(query = {}) {
    let queryRef = taskAssignmentsCollection;

    if (query.TaskID) {
      queryRef = queryRef.where('TaskID', '==', query.TaskID);
    }

    if (query.UserID) {
      queryRef = queryRef.where('UserID', '==', query.UserID);
    }

    const snapshot = await queryRef.get();

    const assignments = [];
    snapshot.forEach(doc => {
      assignments.push(doc.data());
    });

    return assignments;
  }

  static async findOne(query) {
    const { TaskID, UserID } = query;

    let queryRef = taskAssignmentsCollection;

    if (TaskID) {
      queryRef = queryRef.where('TaskID', '==', TaskID);
    }

    if (UserID) {
      queryRef = queryRef.where('UserID', '==', UserID);
    }

    const snapshot = await queryRef.limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }

  static async findById(id) {
    const doc = await taskAssignmentsCollection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  }

  static async deleteOne(query) {
    const { TaskID, UserID } = query;

    let queryRef = taskAssignmentsCollection;

    if (TaskID) {
      queryRef = queryRef.where('TaskID', '==', TaskID);
    }

    if (UserID) {
      queryRef = queryRef.where('UserID', '==', UserID);
    }

    const snapshot = await queryRef.limit(1).get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
      return snapshot.docs[0].data();
    }

    return null;
  }

  static async deleteMany(query) {
    const { TaskID, UserID } = query;

    let queryRef = taskAssignmentsCollection;

    if (TaskID) {
      queryRef = queryRef.where('TaskID', '==', TaskID);
    }

    if (UserID) {
      queryRef = queryRef.where('UserID', '==', UserID);
    }

    const snapshot = await queryRef.get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }
}

export default TaskAssignment;
