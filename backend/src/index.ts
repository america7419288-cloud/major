import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import pageRoutes from './routes/page.routes';
import taskRoutes from './routes/task.routes';
import workspaceTaskRoutes from './routes/tasks';
import databaseRoutes from './routes/database.routes';
import commentRoutes from './routes/comment.routes';
import notificationRoutes from './routes/notification.routes';
import healthRoutes from './routes/health.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', workspaceTaskRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/health', healthRoutes);

import { createServer } from 'http';
import { socketService } from './socket';

const httpServer = createServer(app);

// Initialize Socket Service
socketService.initialize(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
