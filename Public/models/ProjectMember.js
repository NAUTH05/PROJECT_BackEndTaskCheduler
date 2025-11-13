import { nanoid } from 'nanoid';
import { db } from '../../config/firebase.js';

const projectMembersCollection = db.collection('ProjectMembers');

class ProjectMember {
  constructor(data) {
    this.MemberID = data.MemberID || nanoid(8);
    this.ProjectID = data.ProjectID;
    this.UserID = data.UserID;
    this.Role = data.Role || 'member';
    this.JoinedAt = data.JoinedAt || new Date();
  }

  async save() {
    const memberData = {
      MemberID: this.MemberID,
      ProjectID: this.ProjectID,
      UserID: this.UserID,
      Role: this.Role,
      JoinedAt: this.JoinedAt
    };

    await projectMembersCollection.doc(this.MemberID).set(memberData);
    return this;
  }

  static async find(query = {}) {
    let queryRef = projectMembersCollection;

    if (query.ProjectID) {
      queryRef = queryRef.where('ProjectID', '==', query.ProjectID);
    }

    if (query.UserID) {
      queryRef = queryRef.where('UserID', '==', query.UserID);
    }

    if (query.Role) {
      queryRef = queryRef.where('Role', '==', query.Role);
    }

    const snapshot = await queryRef.get();

    const members = [];
    snapshot.forEach(doc => {
      members.push(doc.data());
    });

    return members;
  }

  static async findOne(query) {
    const { ProjectID, UserID } = query;

    let queryRef = projectMembersCollection;

    if (ProjectID) {
      queryRef = queryRef.where('ProjectID', '==', ProjectID);
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
    const doc = await projectMembersCollection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  }

  static async deleteOne(query) {
    const { ProjectID, UserID } = query;

    const members = await this.find({ ProjectID, UserID });

    if (members.length === 0) {
      return null;
    }

    const member = members[0];
    await projectMembersCollection.doc(member.MemberID).delete();
    return member;
  }

  static async findByIdAndDelete(id) {
    await projectMembersCollection.doc(id).delete();
    return { MemberID: id };
  }
}

export default ProjectMember;
