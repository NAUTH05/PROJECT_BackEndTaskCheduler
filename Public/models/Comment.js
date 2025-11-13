import { nanoid } from 'nanoid';
import { db } from '../../config/firebase.js';

class Comment {
  constructor(data) {
    this.CommentID = data.CommentID || nanoid(8);
    this.Content = data.Content;
    this.CreatedAt = data.CreatedAt || new Date().toISOString();
    this.UpdatedAt = data.UpdatedAt || new Date().toISOString();
    this.CreatedByUserID = data.CreatedByUserID;
    this.ProjectID = data.ProjectID || null;
    this.TaskID = data.TaskID || null;
  }

  async save() {
    const commentRef = db.collection('Comments').doc(this.CommentID);
    await commentRef.set({
      CommentID: this.CommentID,
      Content: this.Content,
      CreatedAt: this.CreatedAt,
      UpdatedAt: this.UpdatedAt,
      CreatedByUserID: this.CreatedByUserID,
      ProjectID: this.ProjectID,
      TaskID: this.TaskID
    });
    return this;
  }

  static async find(query = {}) {
    let commentsRef = db.collection('Comments');

    if (query.ProjectID) {
      commentsRef = commentsRef.where('ProjectID', '==', query.ProjectID);
    }
    if (query.TaskID) {
      commentsRef = commentsRef.where('TaskID', '==', query.TaskID);
    }
    if (query.CreatedByUserID) {
      commentsRef = commentsRef.where('CreatedByUserID', '==', query.CreatedByUserID);
    }

    // Remove orderBy to avoid index requirement - sort in memory instead
    const snapshot = await commentsRef.get();
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return new Comment(data);
    });

    // Sort by CreatedAt descending in memory
    return comments.sort((a, b) => {
      return new Date(b.CreatedAt) - new Date(a.CreatedAt);
    });
  }

  static async findOne(query) {
    let commentsRef = db.collection('Comments');

    if (query.CommentID) {
      commentsRef = commentsRef.where('CommentID', '==', query.CommentID);
    }
    if (query.ProjectID) {
      commentsRef = commentsRef.where('ProjectID', '==', query.ProjectID);
    }
    if (query.TaskID) {
      commentsRef = commentsRef.where('TaskID', '==', query.TaskID);
    }
    if (query.CreatedByUserID) {
      commentsRef = commentsRef.where('CreatedByUserID', '==', query.CreatedByUserID);
    }

    const snapshot = await commentsRef.limit(1).get();
    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0].data();
    return new Comment(data);
  }

  static async findById(commentId) {
    const commentRef = db.collection('Comments').doc(commentId);
    const doc = await commentRef.get();

    if (!doc.exists) {
      return null;
    }

    return new Comment(doc.data());
  }

  static async findByIdAndUpdate(commentId, updateData) {
    const commentRef = db.collection('Comments').doc(commentId);
    const doc = await commentRef.get();

    if (!doc.exists) {
      return null;
    }

    const updatedData = {
      ...updateData,
      UpdatedAt: new Date().toISOString()
    };

    await commentRef.update(updatedData);

    const updatedDoc = await commentRef.get();
    return new Comment(updatedDoc.data());
  }

  static async findByIdAndDelete(commentId) {
    const commentRef = db.collection('Comments').doc(commentId);
    const doc = await commentRef.get();

    if (!doc.exists) {
      return null;
    }

    const comment = new Comment(doc.data());
    await commentRef.delete();
    return comment;
  }

  static async deleteMany(query) {
    let commentsRef = db.collection('Comments');

    if (query.ProjectID) {
      commentsRef = commentsRef.where('ProjectID', '==', query.ProjectID);
    }
    if (query.TaskID) {
      commentsRef = commentsRef.where('TaskID', '==', query.TaskID);
    }

    const snapshot = await commentsRef.get();
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }
}

export default Comment;
