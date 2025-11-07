import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { db } from './config/firebase.js';
import projectRoutes from './Public/ProjectAPI.js';
import taskRoutes from './Public/TaskAPI.js';
import userRoutes from './Public/userAPI.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3300;

app.use(cors());
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
app.use('/api', taskRoutes);

app.get('/', (req, res) => {
    res.send('Task Scheduler API');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access at http://localhost:${port}/`);
});