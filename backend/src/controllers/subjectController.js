import Subject from '../models/Subject.js';

export const addSubject = async (req, res) => {
    try {
        const { name, code, lecturesPerWeek, teacher } = req.body;
        const department = req.user.department; // HOD's department

        const subjectExists = await Subject.findOne({ code });
        if (subjectExists) return res.status(400).json({ message: 'Subject with this code already exists' });

        const subject = await Subject.create({
            name, code, department, lecturesPerWeek, teacher
        });

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ department: req.user.department }).populate('teacher', 'name email');
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const editSubject = async (req, res) => {
    try {
        const { name, code, lecturesPerWeek, teacher } = req.body;
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, department: req.user.department },
            { name, code, lecturesPerWeek, teacher },
            { new: true }
        ).populate('teacher', 'name email');

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
