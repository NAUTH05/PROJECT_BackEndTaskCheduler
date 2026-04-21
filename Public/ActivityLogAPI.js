import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import ActivityLog from './models/ActivityLog.js';

const router = express.Router();

// GET /projects/:projectId/activity-logs
router.get('/projects/:projectId/activity-logs', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const logs = await ActivityLog.findByProject(projectId, limit);
    res.status(200).json({
      message: 'Activity logs retrieved',
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving activity logs', error: error.message });
  }
});

export default router;
