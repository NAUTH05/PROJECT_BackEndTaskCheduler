import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkProjectMember, checkProjectOwner } from '../middleware/projectPermission.js';
import { logActivity, LogActions } from '../services/ActivityLogHelper.js';
import { createNotification, notifyProjectShared, NotificationTypes } from '../services/NotificationHelper.js';
import { emitToUser } from '../services/socketManager.js';
import Notification from './models/Notification.js';
import Project from './models/Project.js';
import ProjectMember from './models/ProjectMember.js';
import User from './models/User.js';
const router = express.Router();
router.post('/projects/:id/members', authenticateToken, checkProjectOwner, async (req, res) => {
  try {
    const { userId, UserID } = req.body;
    const targetUserId = userId || UserID; 
    const projectId = req.params.id;
    if (!targetUserId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (req.project.OwnerUserID === targetUserId) {
      return res.status(400).json({ message: 'Owner is already a member by default' });
    }
    const existingMember = await ProjectMember.findOne({
      ProjectID: projectId,
      UserID: targetUserId
    });
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }
    const newMember = new ProjectMember({
      ProjectID: projectId,
      UserID: targetUserId,
      Role: 'member'
    });
    await newMember.save();
    // Send notification to the added user
    const addedByUser = await User.findById(req.user.userId);
    await notifyProjectShared(req.project, user, addedByUser || { userName: 'Owner', _id: req.user.userId });
    // Log activity
    logActivity(projectId, req.user.userId, addedByUser?.userName || 'Owner', LogActions.MEMBER_ADDED,
      `${addedByUser?.userName || 'Owner'} đã thêm ${user.userName} vào dự án`, 'member', targetUserId);
    res.status(201).json({
      message: 'Member added successfully',
      member: {
        MemberID: newMember.MemberID,
        ProjectID: newMember.ProjectID,
        UserID: newMember.UserID,
        UserName: user.userName,
        Email: user.email,
        Role: newMember.Role,
        JoinedAt: newMember.JoinedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.delete('/projects/:id/members/:userId', authenticateToken, checkProjectOwner, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.params.userId;
    if (req.project.OwnerUserID === userId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }
    const member = await ProjectMember.deleteOne({
      ProjectID: projectId,
      UserID: userId
    });
    if (!member) {
      return res.status(404).json({ message: 'Member not found in this project' });
    }
    // Log activity — member removed
    const removedUser = await User.findById(userId);
    const ownerUser = await User.findById(req.user.userId);
    logActivity(projectId, req.user.userId, ownerUser?.userName || 'Owner', LogActions.MEMBER_REMOVED,
      `${ownerUser?.userName || 'Owner'} đã xóa ${removedUser?.userName || userId} khỏi dự án`, 'member', userId);

    // Notify the removed user
    const projectName = req.project?.ProjectName || 'Dự án';
    await createNotification(
      userId,
      NotificationTypes.PROJECT_SHARED,
      '❌ Bị xóa khỏi dự án',
      `${ownerUser?.userName || 'Owner'} đã xóa bạn khỏi dự án "${projectName}"`,
      {
        relatedEntityId: projectId,
        relatedEntityType: 'project',
        actionByUserId: req.user.userId,
        actionByUserName: ownerUser?.userName || 'Owner',
      }
    );

    res.status(200).json({
      message: 'Member removed successfully',
      removedMember: member
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/projects/:id/members', authenticateToken, checkProjectMember, async (req, res) => {
  try {
    const projectId = req.params.id;
    const members = await ProjectMember.find({ ProjectID: projectId });
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await User.findById(member.UserID);
        // Look up invite status from PROJECT_SHARED notification
        const notifications = await Notification.find({
          RecipientUserID: member.UserID,
          RelatedEntityID: projectId,
          Type: 'PROJECT_SHARED'
        });
        const inviteNotif = notifications[0];
        const inviteStatus = inviteNotif?.Status || 'accepted'; // default accepted if no notification found
        return {
          MemberID: member.MemberID,
          UserID: member.UserID,
          UserName: user?.userName || 'Unknown',
          Email: user?.email || 'Unknown',
          Role: member.Role,
          JoinedAt: member.JoinedAt,
          InviteStatus: inviteStatus,
        };
      })
    );
    const owner = await User.findById(req.project.OwnerUserID);
    const ownerInfo = {
      UserID: req.project.OwnerUserID,
      UserName: owner?.userName || 'Unknown',
      Email: owner?.email || 'Unknown',
      Role: 'owner',
      JoinedAt: req.project.createdAt
    };
    res.status(200).json({
      project: {
        ProjectID: req.project.ProjectID,
        ProjectName: req.project.ProjectName
      },
      owner: ownerInfo,
      members: membersWithDetails,
      totalMembers: membersWithDetails.length + 1
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/projects/shared/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const memberships = await ProjectMember.find({ UserID: userId });
    if (memberships.length === 0) {
      return res.status(200).json({
        message: 'No shared projects found',
        projects: []
      });
    }
    const projectIds = memberships.map(m => m.ProjectID);
    const projects = await Promise.all(
      projectIds.map(async (projectId) => {
        const project = await Project.findById(projectId);
        if (!project) return null;
        const owner = await User.findById(project.OwnerUserID);
        const membership = memberships.find(m => m.ProjectID === projectId);
        return {
          ProjectID: project.ProjectID,
          ProjectName: project.ProjectName,
          ProjectDescription: project.ProjectDescription,
          StartDate: project.StartDate,
          EndDate: project.EndDate,
          Status: project.Status,
          OwnerUserID: project.OwnerUserID,
          OwnerName: owner?.userName || 'Unknown',
          MyRole: membership.Role,
          JoinedAt: membership.JoinedAt
        };
      })
    );
    const validProjects = projects.filter(p => p !== null);
    res.status(200).json({
      message: 'Shared projects retrieved successfully',
      projects: validProjects,
      total: validProjects.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/projects/:id/available-users', authenticateToken, checkProjectOwner, async (req, res) => {
  try {
    const projectId = req.params.id;
    const allUsers = await User.find();
    const members = await ProjectMember.find({ ProjectID: projectId });
    const memberUserIds = members.map(m => m.UserID);
    const availableUsers = allUsers.filter(user => {
      const userId = user._id;
      return userId !== req.project.OwnerUserID && !memberUserIds.includes(userId);
    });
    const results = availableUsers.map(user => ({
      userId: user._id,
      userName: user.userName,
      email: user.email
    }));
    res.status(200).json({
      message: 'Available users retrieved successfully',
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving available users',
      error: error.message
    });
  }
});
export default router;
