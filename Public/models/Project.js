import { nanoid } from 'nanoid';
import { db } from '../../config/firebase.js';

const projectsCollection = db.collection('Projects');

class Project {
  constructor(data) {
    this.ProjectID = data.ProjectID || nanoid(8);
    this.ProjectName = data.ProjectName;
    this.ProjectDescription = data.ProjectDescription;
    this.StartDate = data.StartDate;
    this.EndDate = data.EndDate;
    this.Status = data.Status || 'Planning';
    this.OwnerUserID = data.OwnerUserID;
  }

  static getValidStatuses() {
    return ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];
  }

  async save() {
    const projectData = {
      ProjectID: this.ProjectID,
      ProjectName: this.ProjectName,
      ProjectDescription: this.ProjectDescription,
      StartDate: this.StartDate,
      EndDate: this.EndDate,
      Status: this.Status,
      OwnerUserID: this.OwnerUserID,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await projectsCollection.doc(this.ProjectID).set(projectData);
    return this;
  }

  static async find(query = {}) {
    let queryRef = projectsCollection;

    if (query.OwnerUserID) {
      queryRef = queryRef.where('OwnerUserID', '==', query.OwnerUserID);
    }

    if (query.Status) {
      queryRef = queryRef.where('Status', '==', query.Status);
    }

    const snapshot = query.OwnerUserID || query.Status
      ? await queryRef.get()
      : await queryRef.orderBy('createdAt', 'desc').get();

    const projects = [];
    snapshot.forEach(doc => {
      projects.push(doc.data());
    });

    if (query.OwnerUserID || query.Status) {
      projects.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });
    }

    return projects;
  }

  static async findOne(query) {
    const { ProjectID, ProjectName, OwnerUserID } = query;

    let queryRef = projectsCollection;

    if (ProjectID) {
      queryRef = queryRef.where('ProjectID', '==', ProjectID);
    }

    if (ProjectName) {
      queryRef = queryRef.where('ProjectName', '==', ProjectName);
    }

    if (OwnerUserID) {
      queryRef = queryRef.where('OwnerUserID', '==', OwnerUserID);
    }

    const snapshot = await queryRef.limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }

  static async findById(id) {
    const doc = await projectsCollection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  }

  static async findByIdAndDelete(id) {
    await projectsCollection.doc(id).delete();
    return { ProjectID: id };
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const docRef = projectsCollection.doc(id);

    updateData.updatedAt = new Date();

    await docRef.update(updateData);

    if (options.new) {
      const doc = await docRef.get();
      return doc.data();
    }

    return { ProjectID: id, ...updateData };
  }
}

export default Project;
