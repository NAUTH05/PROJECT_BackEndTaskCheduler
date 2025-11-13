import Project from '../Public/models/Project.js';
import ProjectMember from '../Public/models/ProjectMember.js';
import Task from '../Public/models/Task.js';

export const checkTaskAccess = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const project = await Project.findById(task.ProjectID);
    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    const isOwner = project.OwnerUserID === userId;

    const membership = await ProjectMember.findOne({
      ProjectID: task.ProjectID,
      UserID: userId
    });

    const isMember = !!membership;
    const hasAccess = isOwner || isMember;

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You must be the owner or a member of the project to perform this action'
      });
    }

    req.task = task;
    req.project = project;
    req.isOwner = isOwner;
    req.isMember = isMember;
    req.hasAccess = hasAccess;

    next();
  } catch (error) {
    res.status(500).json({
      message: 'Error checking task access',
      error: error.message
    });
  }
};

export const checkTaskAssignment = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Only assigned user or project owner/member can update task status
    const project = await Project.findById(task.ProjectID);
    const isOwner = project.OwnerUserID === userId;
    const isAssigned = task.AssignedToUserID === userId;

    const membership = await ProjectMember.findOne({
      ProjectID: task.ProjectID,
      UserID: userId
    });
    const isMember = !!membership;

    const canUpdate = isOwner || isMember || isAssigned;

    if (!canUpdate) {
      return res.status(403).json({
        message: 'You must be the owner, member, or assigned user to update this task'
      });
    }

    req.task = task;
    req.project = project;
    req.canUpdate = canUpdate;

    next();
  } catch (error) {
    res.status(500).json({
      message: 'Error checking task assignment',
      error: error.message
    });
  }
};
