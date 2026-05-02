import TimetableSlot from '../models/TimetableSlot.js';

export const createSlot = async (req, res) => {
    try {
        const { class: classId, subject, teacher, dayOfWeek, startTime, endTime, room } = req.body;

        // Conflict Detection: Check if teacher is already booked
        const teacherConflict = await TimetableSlot.findOne({
            teacher,
            dayOfWeek,
            startTime,
        });

        if (teacherConflict) {
            return res.status(400).json({ message: 'Teacher is already booked at this time' });
        }

        // Conflict Detection: Check if class is already booked
        const classConflict = await TimetableSlot.findOne({
            class: classId,
            dayOfWeek,
            startTime,
        });

        if (classConflict) {
            return res.status(400).json({ message: 'Class already has a lecture at this time' });
        }

        const slot = await TimetableSlot.create({
            class: classId,
            subject,
            teacher,
            dayOfWeek,
            startTime,
            endTime,
            room
        });

        res.status(201).json(slot);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTimetableForClass = async (req, res) => {
    try {
        const slots = await TimetableSlot.find({ class: req.params.classId })
            .populate('subject', 'name code')
            .populate('teacher', 'name')
            .sort({ dayOfWeek: 1, startTime: 1 });
        
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTimetableForTeacher = async (req, res) => {
    try {
        const slots = await TimetableSlot.find({ teacher: req.params.teacherId })
            .populate('subject', 'name code')
            .populate('class', 'name')
            .sort({ dayOfWeek: 1, startTime: 1 });
        
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteSlot = async (req, res) => {
    try {
        const slot = await TimetableSlot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }
        await slot.deleteOne();
        res.json({ message: 'Slot removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
