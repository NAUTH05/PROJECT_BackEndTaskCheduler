import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { db } from './config/firebase.js';
import activityLogRoutes from './Public/ActivityLogAPI.js';
import commentRoutes from './Public/CommentAPI.js';
import notificationRoutes from './Public/NotificationAPI.js';
import projectRoutes from './Public/ProjectAPI.js';
import projectMemberRoutes from './Public/ProjectMemberAPI.js';
import taskRoutes from './Public/TaskAPI.js';
import userRoutes from './Public/userAPI.js';
import { initSocketIO } from './services/socketManager.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 5128;

const allowedOrigins = [
    'https://hrm.fit.pro.vn',
    'http://localhost:5173',
    'http://localhost:5127',
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use((req, res, next) => {
    if (req.method === 'PUT' && (!req.headers['content-length'] || req.headers['content-length'] === '0')) {
        req.headers['content-type'] = 'text/plain';
    }
    next();
});
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ── Firebase check ────────────────────────────────────────────────────────────
try {
    await db.listCollections();
    console.log("Firebase connected!");
} catch (err) {
    console.error("Firebase error:", err);
}

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', userRoutes);
app.use('/api', projectRoutes);
app.use('/api', projectMemberRoutes);
app.use('/api', taskRoutes);
app.use('/api', commentRoutes);
app.use('/api', notificationRoutes);
app.use('/api', activityLogRoutes);

app.get('/', (req, res) => {
    res.send('Task Scheduler API');
});

// ── HTTP + Socket.IO server ───────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});

initSocketIO(io);

httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access at http://localhost:${port}/`);
    console.log(`Socket.IO ready`);
});