import Project from '../Public/models/Project.js';
import ProjectMember from '../Public/models/ProjectMember.js';

export const checkProjectOwner = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.body.ProjectID;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID required' });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.OwnerUserID !== req.user.userId) {
      return res.status(403).json({ message: 'Only project owner can perform this action' });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const checkProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.body.ProjectID;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID required' });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.OwnerUserID === req.user.userId) {
      req.project = project;
      req.isOwner = true;
      return next();
    }

    const member = await ProjectMember.findOne({
      ProjectID: projectId,
      UserID: req.user.userId
    });

    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    req.project = project;
    req.memberRole = member.Role;
    req.isOwner = false;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const checkProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.body.ProjectID;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID required' });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.OwnerUserID === req.user.userId;

    if (isOwner) {
      req.project = project;
      req.isOwner = true;
      req.hasAccess = true;
      return next();
    }

    const member = await ProjectMember.findOne({
      ProjectID: projectId,
      UserID: req.user.userId
    });

    if (!member) {
      return res.status(403).json({ message: 'You do not have access to this project' });
    }

    req.project = project;
    req.memberRole = member.Role;
    req.isOwner = false;
    req.hasAccess = true;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
