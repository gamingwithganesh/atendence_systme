import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import timetableRoutes from './src/routes/timetableRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import subjectRoutes from './src/routes/subjectRoutes.js';
import swapRoutes from './src/routes/swapRoutes.js';
import classRoutes from './src/routes/classRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
