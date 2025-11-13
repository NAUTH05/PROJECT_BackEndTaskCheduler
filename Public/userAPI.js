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
        } else if (email) {
            user = await User.findOne({ email });
        }

        if (!user) {
            return res.status(401).json({
                message: 'Thông tin đăng nhập không đúng'
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                message: 'Thông tin đăng nhập không đúng'
            });
        }

        const token = generateToken(user._id, user.userName);

        res.status(200).json({
            message: 'Đăng nhập thành công',
            token: token,
            data: {
                _id: user._id,
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

// Search users by email or username
router.get('/users/search', authenticateToken, async (req, res) => {
    try {
        const { query, q } = req.query;
        const searchQuery = query || q;

        if (!searchQuery || searchQuery.trim() === '') {
            return res.status(400).json({
                message: 'Search query is required'
            });
        }

        // Get all users and filter in memory (since Firestore doesn't support case-insensitive search)
        const allUsers = await User.find();

        const searchLower = searchQuery.toLowerCase();
        const filteredUsers = allUsers.filter(user => {
            const userName = (user.userName || '').toLowerCase();
            const email = (user.email || '').toLowerCase();

            return userName.includes(searchLower) || email.includes(searchLower);
        });

        // Return user info without password
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

// Get all users (for dropdown selection)
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find();

        // Return user info without password
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

export default router;