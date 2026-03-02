import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { initSocket } from './socket.js';
import { initDatabase } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import messageRoutes from './routes/messages.js';
import attendanceRoutes from './routes/attendance.js';
import worklogRoutes from './routes/worklog.js';
import salaryRoutes from './routes/salary.js';
import teamRoutes from './routes/team.js';
import projectRoutes from './routes/projects.js';
import talentRoutes from './routes/talent.js';
import dashboardRoutes from './routes/dashboard.js';
import userRoutes from './routes/user.js';

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/attendance', authMiddleware, attendanceRoutes);
app.use('/api/worklog', authMiddleware, worklogRoutes);
app.use('/api/salary', authMiddleware, salaryRoutes);
app.use('/api/teams', authMiddleware, teamRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/talents', authMiddleware, talentRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/user', authMiddleware, userRoutes);

// Serve frontend static files in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function start() {
  await initDatabase();
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`CRM Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
