import Attendance from '../models/Attendance.js';

export const markAttendance = async (req, res) => {
    try {
        const { classId, subjectId, date, presentStudents, absentStudents } = req.body;
        
        // Check if attendance already marked for this class/subject/date
        // We'll normalize date to midnight for comparison
        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(queryDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const existingAttendance = await Attendance.findOne({
            class: classId,
            subject: subjectId,
            teacher: req.user._id,
            date: { $gte: queryDate, $lt: nextDate }
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'Attendance already marked for this date' });
        }

        const attendance = await Attendance.create({
            class: classId,
            subject: subjectId,
            teacher: req.user._id,
            date: new Date(date),
            presentStudents,
            absentStudents
        });

        res.status(201).json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
