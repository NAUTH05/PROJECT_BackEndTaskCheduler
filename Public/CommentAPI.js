import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkCommentOwner } from '../middleware/commentPermission.js';
import { checkProjectAccess } from '../middleware/projectPermission.js';
import { logActivity, LogActions } from '../services/ActivityLogHelper.js';
import Comment from './models/Comment.js';
import Project from './models/Project.js';
import Task from './models/Task.js';
import User from './models/User.js';
const router = express.Router();
router.post('/projects/:id/comments', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { content, Content } = req.body;
    const commentContent = content || Content;
    const projectId = req.params.id;
    const userId = req.user.userId;
    if (!commentContent || commentContent.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    if (!req.hasAccess) {
      return res.status(403).json({
        message: 'You must be the owner or a member of this project to comment'
      });
    }
    const newComment = new Comment({
      Content: commentContent,
      CreatedByUserID: userId,
      ProjectID: projectId,
      TaskID: null
    });
    await newComment.save();
    const user = await User.findById(userId);
    // Log activity
    logActivity(projectId, userId, user?.userName || '', LogActions.COMMENT_ADDED,
      `Đã bình luận: "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`, 'comment', newComment.CommentID);
    res.status(201).json({
      message: 'Comment added successfully',
      data: {
        CommentID: newComment.CommentID,
        Content: newComment.Content,
        CreatedAt: newComment.CreatedAt,
        UpdatedAt: newComment.UpdatedAt,
        CreatedByUserID: newComment.CreatedByUserID,
        ProjectID: newComment.ProjectID,
        UserDetails: {
          UserID: user._id || user.UserID,
          UserName: user.userName || user.UserName,
          Email: user.email || user.Email,
          FullName: user.userName || user.FullName || user.fullName
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error adding comment',
      error: error.message
    });
  }
});
router.post('/tasks/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content, Content } = req.body;
    const commentContent = content || Content;
    const taskId = req.params.id;
    const userId = req.user.userId;
    if (!commentContent || commentContent.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const project = await Project.findById(task.ProjectID);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const isOwner = project.OwnerUserID === userId;
    const ProjectMember = (await import('./models/ProjectMember.js')).default;
    const membership = await ProjectMember.findOne({
      ProjectID: task.ProjectID,
      UserID: userId
    });
    const isAssigned = task.AssignedToUserID === userId;
    if (!isOwner && !membership && !isAssigned) {
      return res.status(403).json({
        message: 'You must be the owner, a member, or assigned to this task to comment'
      });
    }
    const newComment = new Comment({
      Content: commentContent,
      CreatedByUserID: userId,
      ProjectID: null,
      TaskID: taskId
    });
    await newComment.save();
    const user = await User.findById(userId);
    // Log activity for task comment
    logActivity(task.ProjectID, userId, user?.userName || '', LogActions.COMMENT_ADDED,
      `Đã bình luận trên task "${task.TaskName}": "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`, 'comment', newComment.CommentID);
    res.status(201).json({
      message: 'Comment added successfully',
      data: {
        CommentID: newComment.CommentID,
        Content: newComment.Content,
        CreatedAt: newComment.CreatedAt,
        UpdatedAt: newComment.UpdatedAt,
        CreatedByUserID: newComment.CreatedByUserID,
        TaskID: newComment.TaskID,
        UserDetails: {
          UserID: user._id || user.UserID,
          UserName: user.userName || user.UserName,
          Email: user.email || user.Email,
          FullName: user.userName || user.FullName || user.fullName
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error adding comment',
      error: error.message
    });
  }
});
router.get('/projects/:id/comments', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const projectId = req.params.id;
    if (!req.hasAccess) {
      return res.status(403).json({
        message: 'You must be the owner or a member of this project to view comments'
      });
    }
    const comments = await Comment.find({ ProjectID: projectId });
    const commentsWithUserDetails = await Promise.all(
      comments.map(async (comment) => {
        const user = await User.findById(comment.CreatedByUserID);
        return {
          CommentID: comment.CommentID,
          Content: comment.Content,
          CreatedAt: comment.CreatedAt,
          UpdatedAt: comment.UpdatedAt,
          CreatedByUserID: comment.CreatedByUserID,
          ProjectID: comment.ProjectID,
          UserDetails: user ? {
            UserID: user._id || user.UserID,
            UserName: user.userName || user.UserName,
            Email: user.email || user.Email,
            FullName: user.userName || user.FullName || user.fullName
          } : null
        };
      })
    );
    res.status(200).json({
      message: 'Comments retrieved successfully',
      count: commentsWithUserDetails.length,
      data: commentsWithUserDetails
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving comments',
      error: error.message
    });
  }
});
router.get('/tasks/:id/comments', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const project = await Project.findById(task.ProjectID);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const isOwner = project.OwnerUserID === userId;
    const ProjectMember = (await import('./models/ProjectMember.js')).default;
    const membership = await ProjectMember.findOne({
      ProjectID: task.ProjectID,
      UserID: userId
    });
    const isAssigned = task.AssignedToUserID === userId;
    if (!isOwner && !membership && !isAssigned) {
      return res.status(403).json({
        message: 'You must be the owner, a member, or assigned to this task to view comments'
      });
    }
    const comments = await Comment.find({ TaskID: taskId });
    const commentsWithUserDetails = await Promise.all(
      comments.map(async (comment) => {
        const user = await User.findById(comment.CreatedByUserID);
        return {
          CommentID: comment.CommentID,
          Content: comment.Content,
          CreatedAt: comment.CreatedAt,
          UpdatedAt: comment.UpdatedAt,
          CreatedByUserID: comment.CreatedByUserID,
          TaskID: comment.TaskID,
          UserDetails: user ? {
            UserID: user._id || user.UserID,
            UserName: user.userName || user.UserName,
            Email: user.email || user.Email,
            FullName: user.userName || user.FullName || user.fullName
          } : null
        };
      })
    );
    res.status(200).json({
      message: 'Comments retrieved successfully',
      count: commentsWithUserDetails.length,
      data: commentsWithUserDetails
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving comments',
      error: error.message
    });
  }
});
router.put('/comments/:id', authenticateToken, checkCommentOwner, async (req, res) => {
  try {
    const { content, Content } = req.body;
    const commentContent = content || Content;
    const commentId = req.params.id;
    if (!commentContent || commentContent.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
      Content: commentContent
    });
    const user = await User.findById(updatedComment.CreatedByUserID);
    res.status(200).json({
      message: 'Comment updated successfully',
      data: {
        CommentID: updatedComment.CommentID,
        Content: updatedComment.Content,
        CreatedAt: updatedComment.CreatedAt,
        UpdatedAt: updatedComment.UpdatedAt,
        CreatedByUserID: updatedComment.CreatedByUserID,
        ProjectID: updatedComment.ProjectID,
        TaskID: updatedComment.TaskID,
        UserDetails: {
          UserID: user._id || user.UserID,
          UserName: user.userName || user.UserName,
          Email: user.email || user.Email,
          FullName: user.userName || user.FullName || user.fullName
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating comment',
      error: error.message
    });
  }
});
router.delete('/comments/:id', authenticateToken, checkCommentOwner, async (req, res) => {
  try {
    const commentId = req.params.id;
    // Fetch comment before delete for logging
    const comment = await Comment.findById(commentId);
    await Comment.findByIdAndDelete(commentId);
    // Log activity
    if (comment) {
      const projectId = comment.ProjectID || null;
      if (!projectId && comment.TaskID) {
        const task = await Task.findById(comment.TaskID);
        if (task) {
          logActivity(task.ProjectID, req.user.userId, req.user.userName || '', LogActions.COMMENT_DELETED,
            `Đã xóa bình luận trên task`, 'comment', commentId);
        }
      } else if (projectId) {
        logActivity(projectId, req.user.userId, req.user.userName || '', LogActions.COMMENT_DELETED,
          `Đã xóa bình luận`, 'comment', commentId);
      }
    }
    res.status(200).json({
      message: 'Comment deleted successfully',
      data: {
        CommentID: commentId
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting comment',
      error: error.message
    });
  }
});
export default router;
