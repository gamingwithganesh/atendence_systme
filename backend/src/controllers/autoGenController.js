import TimetableSlot from '../models/TimetableSlot.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const regularSlots = [
    { start: '10:30', end: '11:30' },
    { start: '11:30', end: '12:30' },
    { start: '12:30', end: '13:30' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
];

const saturdaySlots = [
    { start: '10:30', end: '11:30' },
    { start: '11:30', end: '12:30' },
    { start: '12:30', end: '13:30' }
];

export const generateTimetable = async (req, res) => {
    try {
        const { classId } = req.body;
        
        const targetClass = await Class.findById(classId);
        if (!targetClass) return res.status(404).json({ message: 'Class not found' });

        // Get subjects for this class's department
        const subjects = await Subject.find({ department: targetClass.department });
        
        // For MVP: assume each subject is taught by a random teacher in the same department
        const teachers = await User.find({ role: 'teacher', department: targetClass.department });
        if (teachers.length === 0) return res.status(400).json({ message: 'No teachers found for this department' });

        // Clear existing timetable for this class
        await TimetableSlot.deleteMany({ class: classId });

        const newSlots = [];

        for (const subject of subjects) {
            let assignedLectures = 0;
            // Use explicitly mapped teacher for this subject
            const teacher = teachers.find(t => t._id.toString() === subject.teacher?.toString());
            
            if (!teacher) continue; // Skip if no teacher assigned

            while (assignedLectures < subject.lecturesPerWeek) {
                // Pick a random day and slot
                const randomDay = days[Math.floor(Math.random() * days.length)];
                const availableSlots = randomDay === 'Saturday' ? saturdaySlots : regularSlots;
                const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];

                // Check constraints: Is slot already filled for this class?
                const isClassBusy = newSlots.some(s => s.dayOfWeek === randomDay && s.startTime === randomSlot.start);
                
                // Check constraints: Is teacher already teaching in this slot? (Check DB and current array)
                const isTeacherBusyInDB = await TimetableSlot.findOne({ teacher: teacher._id, dayOfWeek: randomDay, startTime: randomSlot.start });
                const isTeacherBusyInArr = newSlots.some(s => s.teacher === teacher._id && s.dayOfWeek === randomDay && s.startTime === randomSlot.start);

                if (!isClassBusy && !isTeacherBusyInDB && !isTeacherBusyInArr) {
                    newSlots.push({
                        class: classId,
                        subject: subject._id,
                        teacher: teacher._id,
                        dayOfWeek: randomDay,
                        startTime: randomSlot.start,
                        endTime: randomSlot.end,
                        room: `Room-${Math.floor(Math.random() * 100) + 100}`
                    });
                    assignedLectures++;
                }
            }
        }

        const savedSlots = await TimetableSlot.insertMany(newSlots);
        res.status(201).json({ message: 'Timetable generated successfully', slots: savedSlots });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
