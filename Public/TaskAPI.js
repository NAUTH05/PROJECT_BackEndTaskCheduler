import { Router } from 'express';
import { nanoid } from 'nanoid';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkTaskAccess } from '../middleware/taskPermission.js';
import { notifyTaskAssignment, notifyTaskUnassignment } from '../services/NotificationHelper.js';
import Project from './models/Project.js';
import ProjectMember from './models/ProjectMember.js';
import Task from './models/Task.js';
import TaskAssignment from './models/TaskAssignment.js';
import User from './models/User.js';

const router = Router();

router.post('/tasks', authenticateToken, async (req, res) => {
    try {
        const { ProjectID, TaskName, TaskDescription, DueDate, Priority, Status, AssignedToUserID } = req.body;

        if (!ProjectID || !TaskName || !TaskDescription || !DueDate) {
            return res.status(400).json({
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const project = await Project.findById(ProjectID);
        if (!project) {
            return res.status(404).json({
                message: 'Không tìm thấy project'
            });
        }

        if (AssignedToUserID) {
            const user = await User.findById(AssignedToUserID);
            if (!user) {
                return res.status(404).json({
                    message: 'Không tìm thấy user'
                });
            }
        }

        const dueDate = new Date(DueDate);
        if (isNaN(dueDate.getTime())) {
            return res.status(400).json({
                message: 'Ngày không hợp lệ'
            });
        }

        const validPriorities = Task.getValidPriorities();
        if (Priority && !validPriorities.includes(Priority)) {
            return res.status(400).json({
                message: `Priority không hợp lệ. Chỉ chấp nhận: ${validPriorities.join(', ')}`
            });
        }

        const validStatuses = Task.getValidStatuses();
        if (Status && !validStatuses.includes(Status)) {
            return res.status(400).json({
                message: `Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`
            });
        }

        const newTaskID = nanoid(8);

        const newTask = new Task({
            TaskID: newTaskID,
            ProjectID,
            TaskName,
            TaskDescription,
            DueDate,
            Priority: Priority || 'Medium',
            Status: Status || 'Backlog',
            AssignedToUserID: AssignedToUserID || null
        });

        await newTask.save();

        // Get assigned user details if task is assigned
        let assignedUserDetails = null;
        if (AssignedToUserID) {
            const assignedUser = await User.findById(AssignedToUserID);
            if (assignedUser) {
                assignedUserDetails = {
                    UserID: assignedUser._id || assignedUser.UserID,
                    UserName: assignedUser.userName || assignedUser.UserName,
                    Email: assignedUser.email || assignedUser.Email
                };
            }
        }

        res.status(201).json({
            message: 'Tạo task thành công',
            taskId: newTask.TaskID,
            data: {
                TaskID: newTask.TaskID,
                ProjectID: newTask.ProjectID,
                TaskName: newTask.TaskName,
                TaskDescription: newTask.TaskDescription,
                DueDate: newTask.DueDate,
                Priority: newTask.Priority,
                Status: newTask.Status,
                AssignedToUserID: newTask.AssignedToUserID,
                AssignedUserDetails: assignedUserDetails,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

router.get('/tasks', authenticateToken, async (req, res) => {
    try {
        const { ProjectID, AssignedToUserID, Status, Priority } = req.query;

        const query = {};
        if (ProjectID) query.ProjectID = ProjectID;
        if (AssignedToUserID) query.AssignedToUserID = AssignedToUserID;
        if (Status) query.Status = Status;
        if (Priority) query.Priority = Priority;

        const tasks = await Task.find(query);

        // Get assigned user details for each task (both old single assignment and new multiple assignments)
        const tasksWithUserDetails = await Promise.all(
            tasks.map(async (task) => {
                // Old single assignment (backward compatibility)
                let assignedUserDetails = null;
                if (task.AssignedToUserID) {
                    const assignedUser = await User.findById(task.AssignedToUserID);
                    if (assignedUser) {
                        assignedUserDetails = {
                            UserID: assignedUser._id || assignedUser.UserID,
                            UserName: assignedUser.userName || assignedUser.UserName,
                            Email: assignedUser.email || assignedUser.Email
                        };
                    }
                }

                // New multiple assignments
                const assignments = await TaskAssignment.find({ TaskID: task.TaskID });
                const assignedUsers = await Promise.all(
                    assignments.map(async (assignment) => {
                        const user = await User.findById(assignment.UserID);
                        if (!user) return null;

                        return {
                            AssignmentID: assignment.AssignmentID,
                            UserID: user._id || user.UserID,
                            UserName: user.userName || user.UserName || 'Unknown',
                            Email: user.email || user.Email || '',
                            AssignedAt: assignment.AssignedAt?.toDate ?
                                assignment.AssignedAt.toDate().toISOString() :
                                (assignment.AssignedAt instanceof Date ?
                                    assignment.AssignedAt.toISOString() :
                                    assignment.AssignedAt)
                        };
                    })
                );

                return {
                    TaskID: task.TaskID,
                    ProjectID: task.ProjectID,
                    TaskName: task.TaskName,
                    TaskDescription: task.TaskDescription,
                    DueDate: task.DueDate,
                    Priority: task.Priority,
                    Status: task.Status,
                    AssignedToUserID: task.AssignedToUserID,
                    AssignedUserDetails: assignedUserDetails,
                    AssignedUsers: assignedUsers.filter(u => u !== null),
                    AssignedUsersCount: assignedUsers.filter(u => u !== null).length
                };
            })
        );

        res.status(200).json({
            message: 'Lấy danh sách thành công',
            count: tasksWithUserDetails.length,
            taskIds: tasksWithUserDetails.map(t => t.TaskID),
            data: tasksWithUserDetails
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

router.get('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({
                message: 'Không tìm thấy task'
            });
        }

        // Get assigned user details if task is assigned (old single assignment)
        let assignedUserDetails = null;
        if (task.AssignedToUserID) {
            const assignedUser = await User.findById(task.AssignedToUserID);
            if (assignedUser) {
                assignedUserDetails = {
                    UserID: assignedUser._id || assignedUser.UserID,
                    UserName: assignedUser.userName || assignedUser.UserName,
                    Email: assignedUser.email || assignedUser.Email
                };
            }
        }

        // Get new multiple assignments
        const assignments = await TaskAssignment.find({ TaskID: task.TaskID });
        const assignedUsers = await Promise.all(
            assignments.map(async (assignment) => {
                const user = await User.findById(assignment.UserID);
                if (!user) return null;

                return {
                    AssignmentID: assignment.AssignmentID,
                    UserID: user._id || user.UserID,
                    UserName: user.userName || user.UserName || 'Unknown',
                    Email: user.email || user.Email || '',
                    AssignedAt: assignment.AssignedAt?.toDate ?
                        assignment.AssignedAt.toDate().toISOString() :
                        (assignment.AssignedAt instanceof Date ?
                            assignment.AssignedAt.toISOString() :
                            assignment.AssignedAt)
                };
            })
        );

        res.status(200).json({
            message: 'Lấy thông tin thành công',
            taskId: task.TaskID,
            data: {
                TaskID: task.TaskID,
                ProjectID: task.ProjectID,
                TaskName: task.TaskName,
                TaskDescription: task.TaskDescription,
                DueDate: task.DueDate,
                Priority: task.Priority,
                Status: task.Status,
                AssignedToUserID: task.AssignedToUserID,
                AssignedUserDetails: assignedUserDetails,
                AssignedUsers: assignedUsers.filter(u => u !== null),
                AssignedUsersCount: assignedUsers.filter(u => u !== null).length
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

router.put('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingTask = await Task.findById(id);
        if (!existingTask) {
            return res.status(404).json({
                message: 'Không tìm thấy task'
            });
        }

        if (updateData.DueDate) {
            const dueDate = new Date(updateData.DueDate);
            if (isNaN(dueDate.getTime())) {
                return res.status(400).json({
                    message: 'Ngày không hợp lệ'
                });
            }
        }

        if (updateData.Priority) {
            const validPriorities = Task.getValidPriorities();
            if (!validPriorities.includes(updateData.Priority)) {
                return res.status(400).json({
                    message: `Priority không hợp lệ. Chỉ chấp nhận: ${validPriorities.join(', ')}`
                });
            }
        }

        if (updateData.Status) {
            const validStatuses = Task.getValidStatuses();
            if (!validStatuses.includes(updateData.Status)) {
                return res.status(400).json({
                    message: `Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`
                });
            }
        }

        if (updateData.AssignedToUserID) {
            const user = await User.findById(updateData.AssignedToUserID);
            if (!user) {
                return res.status(404).json({
                    message: 'Không tìm thấy user'
                });
            }
        }

        delete updateData.TaskID;
        delete updateData.ProjectID;

        const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true });

        // Get assigned user details if task is assigned
        let assignedUserDetails = null;
        if (updatedTask.AssignedToUserID) {
            const assignedUser = await User.findById(updatedTask.AssignedToUserID);
            if (assignedUser) {
                assignedUserDetails = {
                    UserID: assignedUser._id || assignedUser.UserID,
                    UserName: assignedUser.userName || assignedUser.UserName,
                    Email: assignedUser.email || assignedUser.Email
                };
            }
        }

        res.status(200).json({
            message: 'Cập nhật thành công',
            taskId: id,
            data: {
                TaskID: updatedTask.TaskID,
                ProjectID: updatedTask.ProjectID,
                TaskName: updatedTask.TaskName,
                TaskDescription: updatedTask.TaskDescription,
                DueDate: updatedTask.DueDate,
                Priority: updatedTask.Priority,
                Status: updatedTask.Status,
                AssignedToUserID: updatedTask.AssignedToUserID,
                AssignedUserDetails: assignedUserDetails
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

router.delete('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const existingTask = await Task.findById(id);
        if (!existingTask) {
            return res.status(404).json({
                message: 'Không tìm thấy task'
            });
        }

        await Task.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Xóa thành công',
            taskId: id,
            deleted: true,
            data: { TaskID: id }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Assign task to a user
router.put('/tasks/:id/assign', authenticateToken, checkTaskAccess, async (req, res) => {
    try {
        // Check if user is project owner
        if (!req.isOwner) {
            return res.status(403).json({
                message: 'Chỉ owner mới có thể assign task'
            });
        }

        const { userId, assignedToUserID } = req.body;
        const targetUserId = userId || assignedToUserID;
        const taskId = req.params.id;

        if (!targetUserId) {
            return res.status(400).json({
                message: 'userId is required'
            });
        }

        // Check if user exists
        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Check if user is owner or member of the project
        const isUserOwner = req.project.OwnerUserID === targetUserId;
        const userMembership = await ProjectMember.findOne({
            ProjectID: req.task.ProjectID,
            UserID: targetUserId
        });
        const isUserMember = !!userMembership;

        if (!isUserOwner && !isUserMember) {
            return res.status(400).json({
                message: 'Can only assign task to project owner or members'
            });
        }

        // Update task with assigned user (backward compatibility)
        const updatedTask = await Task.findByIdAndUpdate(taskId, {
            AssignedToUserID: targetUserId
        }, { new: true });

        // Create TaskAssignment record if not exists
        const existingAssignment = await TaskAssignment.findOne({
            TaskID: taskId,
            UserID: targetUserId
        });

        if (!existingAssignment) {
            const assignment = new TaskAssignment({
                TaskID: taskId,
                UserID: targetUserId,
                AssignedBy: req.user.userId,
                AssignedAt: new Date()
            });
            await assignment.save();
        }

        // Log notification
        const assignedBy = await User.findById(req.user.userId);
        await notifyTaskAssignment(updatedTask, user, assignedBy);

        res.status(200).json({
            message: 'Task assigned successfully',
            data: {
                TaskID: updatedTask.TaskID,
                TaskName: updatedTask.TaskName,
                AssignedToUserID: updatedTask.AssignedToUserID,
                AssignedToUser: {
                    UserID: user._id || user.UserID,
                    Email: user.email || user.Email,
                    FullName: user.userName || user.FullName || user.fullName
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error assigning task',
            error: error.message
        });
    }
});

// Unassign task
router.put('/tasks/:id/unassign', authenticateToken, checkTaskAccess, async (req, res) => {
    try {
        // Check if user is project owner
        if (!req.isOwner) {
            return res.status(403).json({
                message: 'Chỉ owner mới có thể unassign task'
            });
        }

        const taskId = req.params.id;

        if (!req.task.AssignedToUserID) {
            return res.status(400).json({
                message: 'Task is not assigned to anyone'
            });
        }

        // Store the previously assigned user ID before updating
        const previousAssignedUserId = req.task.AssignedToUserID;

        // Update task to remove assigned user (backward compatibility)
        const updatedTask = await Task.findByIdAndUpdate(taskId, {
            AssignedToUserID: null
        }, { new: true });

        // Delete ALL TaskAssignment records for this task (unassign all users)
        await TaskAssignment.deleteMany({ TaskID: taskId });

        // Send notification to previously assigned user
        const unassignedBy = await User.findById(req.user.userId);
        await notifyTaskUnassignment(updatedTask, previousAssignedUserId, unassignedBy);

        res.status(200).json({
            message: 'Task unassigned successfully',
            data: {
                TaskID: updatedTask.TaskID,
                TaskName: updatedTask.TaskName,
                AssignedToUserID: null
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error unassigning task',
            error: error.message
        });
    }
});

// Get tasks assigned to current user
router.get('/tasks/my-tasks', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const tasks = await Task.find({ AssignedToUserID: userId });

        // Get project details for each task
        const tasksWithProjectDetails = await Promise.all(
            tasks.map(async (task) => {
                const project = await Project.findById(task.ProjectID);
                return {
                    TaskID: task.TaskID,
                    TaskName: task.TaskName,
                    TaskDescription: task.TaskDescription,
                    DueDate: task.DueDate,
                    Priority: task.Priority,
                    Status: task.Status,
                    AssignedToUserID: task.AssignedToUserID,
                    ProjectDetails: project ? {
                        ProjectID: project.ProjectID,
                        ProjectName: project.ProjectName,
                        Status: project.Status
                    } : null
                };
            })
        );

        res.status(200).json({
            message: 'Retrieved assigned tasks successfully',
            count: tasksWithProjectDetails.length,
            data: tasksWithProjectDetails
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving assigned tasks',
            error: error.message
        });
    }
});

// ========== NEW: MULTIPLE ASSIGNMENTS ==========

// Assign multiple users to a task
router.post('/tasks/:id/assign-users', authenticateToken, checkTaskAccess, async (req, res) => {
    try {
        // Check if user is project owner
        if (!req.isOwner) {
            return res.status(403).json({
                message: 'Chỉ owner mới có thể assign users'
            });
        }

        const { userIds } = req.body;
        const taskId = req.params.id;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                message: 'userIds array is required'
            });
        }

        const task = req.task;
        const assignedBy = req.user.userId;
        const successfulAssignments = [];
        const errors = [];

        for (const userId of userIds) {
            try {
                // Check if user exists
                const user = await User.findById(userId);
                if (!user) {
                    errors.push({ userId, error: 'User not found' });
                    continue;
                }

                // Check if user is owner or member of the project
                const isUserOwner = req.project.OwnerUserID === userId;
                const userMembership = await ProjectMember.findOne({
                    ProjectID: task.ProjectID,
                    UserID: userId
                });
                const isUserMember = !!userMembership;

                if (!isUserOwner && !isUserMember) {
                    errors.push({ userId, error: 'User must be project owner or member' });
                    continue;
                }

                // Check if already assigned
                const existingAssignment = await TaskAssignment.findOne({
                    TaskID: taskId,
                    UserID: userId
                });

                if (existingAssignment) {
                    errors.push({ userId, error: 'User already assigned to this task' });
                    continue;
                }

                // Create assignment
                const assignment = new TaskAssignment({
                    TaskID: taskId,
                    UserID: userId,
                    AssignedBy: assignedBy
                });

                await assignment.save();

                // Send notification
                const assignedByUser = await User.findById(assignedBy);
                await notifyTaskAssignment(task, user, assignedByUser);

                successfulAssignments.push({
                    AssignmentID: assignment.AssignmentID,
                    UserID: userId,
                    UserName: user.userName || user.UserName,
                    Email: user.email || user.Email
                });
            } catch (err) {
                errors.push({ userId, error: err.message });
            }
        }

        res.status(200).json({
            message: 'Assignment process completed',
            successful: successfulAssignments,
            successCount: successfulAssignments.length,
            errors: errors,
            errorCount: errors.length
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error assigning users to task',
            error: error.message
        });
    }
});

// Get all users assigned to a task
router.get('/tasks/:id/assigned-users', authenticateToken, checkTaskAccess, async (req, res) => {
    try {
        const taskId = req.params.id;

        const assignments = await TaskAssignment.find({ TaskID: taskId });

        const assignedUsers = await Promise.all(
            assignments.map(async (assignment) => {
                const user = await User.findById(assignment.UserID);
                if (!user) return null;

                return {
                    AssignmentID: assignment.AssignmentID,
                    UserID: assignment.UserID,
                    UserName: user.userName || user.UserName || 'Unknown',
                    Email: user.email || user.Email || 'Unknown',
                    AssignedAt: assignment.AssignedAt?.toDate ?
                        assignment.AssignedAt.toDate().toISOString() :
                        (assignment.AssignedAt instanceof Date ?
                            assignment.AssignedAt.toISOString() :
                            assignment.AssignedAt),
                    AssignedBy: assignment.AssignedBy
                };
            })
        );

        res.status(200).json({
            message: 'Retrieved assigned users successfully',
            taskId: taskId,
            count: assignedUsers.length,
            data: assignedUsers
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving assigned users',
            error: error.message
        });
    }
});

// Unassign a specific user from a task
router.delete('/tasks/:id/unassign-user/:userId', authenticateToken, checkTaskAccess, async (req, res) => {
    try {
        // Check if user is project owner
        if (!req.isOwner) {
            return res.status(403).json({
                message: 'Chỉ owner mới có thể unassign user'
            });
        }

        const taskId = req.params.id;
        const userId = req.params.userId;

        const result = await TaskAssignment.deleteOne({
            TaskID: taskId,
            UserID: userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'User is not assigned to this task'
            });
        }

        // Check if this was the last assignment, update Task.AssignedToUserID
        const remainingAssignments = await TaskAssignment.find({ TaskID: taskId });
        if (remainingAssignments.length === 0) {
            await Task.findByIdAndUpdate(taskId, { AssignedToUserID: null });
        }

        // Send notification
        const task = req.task;
        const unassignedBy = await User.findById(req.user.userId);
        await notifyTaskUnassignment(task, userId, unassignedBy);

        res.status(200).json({
            message: 'User unassigned from task successfully',
            data: {
                TaskID: taskId,
                UserID: userId
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error unassigning user from task',
            error: error.message
        });
    }
});

// Get all tasks assigned to current user (using TaskAssignment)
router.get('/tasks/my-assigned-tasks', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get all assignments for this user
        const assignments = await TaskAssignment.find({ UserID: userId });

        // Get task details for each assignment
        const tasksWithDetails = await Promise.all(
            assignments.map(async (assignment) => {
                const task = await Task.findById(assignment.TaskID);
                if (!task) return null;

                const project = await Project.findById(task.ProjectID);

                return {
                    AssignmentID: assignment.AssignmentID,
                    TaskID: task.TaskID,
                    TaskName: task.TaskName,
                    TaskDescription: task.TaskDescription,
                    DueDate: task.DueDate,
                    Priority: task.Priority,
                    Status: task.Status,
                    AssignedAt: assignment.AssignedAt?.toDate ?
                        assignment.AssignedAt.toDate().toISOString() :
                        (assignment.AssignedAt instanceof Date ?
                            assignment.AssignedAt.toISOString() :
                            assignment.AssignedAt),
                    ProjectDetails: project ? {
                        ProjectID: project.ProjectID,
                        ProjectName: project.ProjectName,
                        Status: project.Status
                    } : null
                };
            })
        );

        // Filter out null values (deleted tasks)
        const validTasks = tasksWithDetails.filter(t => t !== null);

        res.status(200).json({
            message: 'Retrieved assigned tasks successfully',
            count: validTasks.length,
            data: validTasks
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving assigned tasks',
            error: error.message
        });
    }
});

export default router;
