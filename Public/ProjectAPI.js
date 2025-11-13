import { Router } from 'express';
import { nanoid } from 'nanoid';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Project from './models/Project.js';
import User from './models/User.js';

const router = Router();

router.post('/projects', authenticateToken, async (req, res) => {
    try {
        const { ProjectName, ProjectDescription, StartDate, EndDate, Status, OwnerUserID } = req.body;

        if (!ProjectName || !ProjectDescription || !StartDate || !OwnerUserID) {
            return res.status(400).json({
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const owner = await User.findById(OwnerUserID);
        if (!owner) {
            return res.status(404).json({
                message: 'Không tìm thấy user'
            });
        }

        const startDate = new Date(StartDate);
        if (isNaN(startDate.getTime())) {
            return res.status(400).json({
                message: 'Ngày bắt đầu không hợp lệ'
            });
        }

        if (EndDate) {
            const endDate = new Date(EndDate);
            if (isNaN(endDate.getTime())) {
                return res.status(400).json({
                    message: 'Ngày kết thúc không hợp lệ'
                });
            }
            if (endDate < startDate) {
                return res.status(400).json({
                    message: 'Ngày kết thúc phải sau ngày bắt đầu'
                });
            }
        }

        const validStatuses = Project.getValidStatuses();
        if (Status && !validStatuses.includes(Status)) {
            return res.status(400).json({
                message: `Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`
            });
        }

        const newProjectID = nanoid(8);

        const newProject = new Project({
            ProjectID: newProjectID,
            ProjectName,
            ProjectDescription,
            StartDate,
            EndDate,
            Status: Status || 'Planning',
            OwnerUserID
        });

        await newProject.save();

        res.status(201).json({
            message: 'Tạo project thành công',
            projectId: newProject.ProjectID,
            data: {
                ProjectID: newProject.ProjectID,
                ProjectName: newProject.ProjectName,
                ProjectDescription: newProject.ProjectDescription,
                StartDate: newProject.StartDate,
                EndDate: newProject.EndDate,
                Status: newProject.Status,
                OwnerUserID: newProject.OwnerUserID,
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

router.get('/projects', authenticateToken, async (req, res) => {
    try {
        const { OwnerUserID, Status } = req.query;

        const query = {};
        if (OwnerUserID) query.OwnerUserID = OwnerUserID;
        if (Status) query.Status = Status;

        const projects = await Project.find(query);

        res.status(200).json({
            message: 'Lấy danh sách thành công',
            count: projects.length,
            projectIds: projects.map(p => p.ProjectID),
            data: projects
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

router.get('/projects/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Không tìm thấy project'
            });
        }

        res.status(200).json({
            message: 'Lấy thông tin thành công',
            projectId: project.ProjectID,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

router.put('/projects/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingProject = await Project.findById(id);
        if (!existingProject) {
            return res.status(404).json({
                message: 'Không tìm thấy project'
            });
        }

        if (updateData.StartDate) {
            const startDate = new Date(updateData.StartDate);
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({
                    message: 'Ngày bắt đầu không hợp lệ'
                });
            }
        }

        if (updateData.EndDate) {
            const endDate = new Date(updateData.EndDate);
            if (isNaN(endDate.getTime())) {
                return res.status(400).json({
                    message: 'Ngày kết thúc không hợp lệ'
                });
            }
        }

        if (updateData.Status) {
            const validStatuses = Project.getValidStatuses();
            if (!validStatuses.includes(updateData.Status)) {
                return res.status(400).json({
                    message: `Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`
                });
            }
        }

        delete updateData.ProjectID;
        delete updateData.OwnerUserID;

        const updatedProject = await Project.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({
            message: 'Cập nhật thành công',
            projectId: id,
            data: updatedProject
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

router.delete('/projects/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const existingProject = await Project.findById(id);
        if (!existingProject) {
            return res.status(404).json({
                message: 'Không tìm thấy project'
            });
        }

        await Project.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Xóa thành công',
            projectId: id,
            deleted: true,
            data: { ProjectID: id }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

export default router;
