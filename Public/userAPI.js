import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { authenticateToken } from '../middleware/authMiddleware.js';
import User from './models/User.js';
const router = Router();
const generateToken = (userId, userName) => {
    return jwt.sign(
        { userId, userName },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};
router.post('/register', async (req, res) => {
    try {
        const { userName, email, password } = req.body;
        if (!userName || !email || !password) {
            return res.status(400).json({
                message: 'Thiếu thông tin bắt buộc'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Email không hợp lệ'
            });
        }
        const existingUserByName = await User.findOne({ userName });
        if (existingUserByName) {
            return res.status(409).json({
                message: 'Tên đăng nhập đã tồn tại'
            });
        }
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(409).json({
                message: 'Email đã được sử dụng'
            });
        }
        const newId = nanoid(6);
        const newUser = new User({
            _id: newId,
            userName,
            email,
            password
        });
        await newUser.save();
        const token = generateToken(newUser._id, newUser.userName);
        res.status(201).json({
            message: 'Đăng ký thành công',
            token: token,
            data: {
                _id: newUser._id,
                userId: newUser._id,
                userName: newUser.userName,
                email: newUser.email,
                createdAt: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { userName, email, password } = req.body;
        if (!password) {
            return res.status(400).json({
                message: 'Vui lòng nhập mật khẩu'
            });
        }
        if (!userName && !email) {
            return res.status(400).json({
                message: 'Vui lòng nhập tên đăng nhập hoặc email'
            });
        }
        let user;
        if (userName) {
            user = await User.findOne({ userName });
            if (!user) {
                return res.status(404).json({
                    message: 'Tên đăng nhập không tồn tại'
                });
            }
        } else if (email) {
            user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    message: 'Email không tồn tại trong hệ thống'
                });
            }
        }
        if (user.password !== password) {
            return res.status(401).json({
                message: 'Mật khẩu không chính xác'
            });
        }
        const token = generateToken(user._id, user.userName);
        res.status(200).json({
            message: 'Đăng nhập thành công',
            token: token,
            data: {
                _id: user._id,
                userId: user._id,
                userName: user.userName,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});
router.get('/users/search', authenticateToken, async (req, res) => {
    try {
        const { query, q } = req.query;
        const searchQuery = query || q;
        if (!searchQuery || searchQuery.trim() === '') {
            return res.status(400).json({
                message: 'Search query is required'
            });
        }
        const allUsers = await User.find();
        const searchLower = searchQuery.toLowerCase();
        const filteredUsers = allUsers.filter(user => {
            const userName = (user.userName || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            return userName.includes(searchLower) || email.includes(searchLower);
        });
        const results = filteredUsers.map(user => ({
            userId: user._id,
            userName: user.userName,
            email: user.email
        }));
        res.status(200).json({
            message: 'Search completed',
            count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error searching users',
            error: error.message
        });
    }
});
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find();
        const results = users.map(user => ({
            userId: user._id,
            userName: user.userName,
            email: user.email
        }));
        res.status(200).json({
            message: 'Retrieved all users',
            count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving users',
            error: error.message
        });
    }
});

// ─── Profile endpoints ─────────────────────────────────────────────────────────
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({
            data: {
                _id: user._id,
                userId: user._id,
                userName: user.userName,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { userName, email } = req.body;
        const userId = req.user.userId;
        if (!userName && !email) {
            return res.status(400).json({ message: 'Cần ít nhất một trường để cập nhật' });
        }
        // Check uniqueness
        if (userName) {
            const existing = await User.findOne({ userName });
            if (existing && existing._id !== userId) {
                return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
            }
        }
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Email không hợp lệ' });
            }
            const existing = await User.findOne({ email });
            if (existing && existing._id !== userId) {
                return res.status(409).json({ message: 'Email đã được sử dụng' });
            }
        }
        const updateData = {};
        if (userName) updateData.userName = userName;
        if (email) updateData.email = email;
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        res.status(200).json({
            message: 'Cập nhật thành công',
            data: {
                _id: updatedUser._id,
                userId: updatedUser._id,
                userName: updatedUser.userName,
                email: updatedUser.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.put('/profile/password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.userId;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Cần nhập mật khẩu cũ và mới' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.password !== oldPassword) {
            return res.status(401).json({ message: 'Mật khẩu cũ không chính xác' });
        }
        await User.findByIdAndUpdate(userId, { password: newPassword });
        res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;