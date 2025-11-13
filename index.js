import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { db } from './config/firebase.js';
import commentRoutes from './Public/CommentAPI.js';
import notificationRoutes from './Public/NotificationAPI.js';
import projectRoutes from './Public/ProjectAPI.js';
import projectMemberRoutes from './Public/ProjectMemberAPI.js';
import taskRoutes from './Public/TaskAPI.js';
import userRoutes from './Public/userAPI.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3300;

app.use(cors());

// Handle empty body for PUT requests (fix "null" is not valid JSON error)
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

try {
    await db.listCollections();
    console.log("Firebase connected!");
} catch (err) {
    console.error("Firebase error:", err);
}

app.use('/api', userRoutes);
app.use('/api', projectRoutes);
app.use('/api', projectMemberRoutes);
app.use('/api', taskRoutes);
app.use('/api', commentRoutes);
app.use('/api', notificationRoutes);

app.get('/', (req, res) => {
    res.send('Task Scheduler API');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access at http://localhost:${port}/`);
});