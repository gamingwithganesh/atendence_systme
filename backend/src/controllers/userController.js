import User from '../models/User.js';

// Admin adds HOD
export const addHOD = async (req, res) => {
    try {
        const { name, email, password, department } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const hod = await User.create({
            name, email, password, department, role: 'hod'
        });

        res.status(201).json({ message: 'HOD added successfully', user: { _id: hod._id, name: hod.name, department: hod.department } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin gets all HODs
export const getHODs = async (req, res) => {
    try {
        const hods = await User.find({ role: 'hod' }).select('-password');
        res.json(hods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin deletes HOD
export const deleteHOD = async (req, res) => {
    try {
        const hod = await User.findOne({ _id: req.params.id, role: 'hod' });
        
        if (!hod) {
            return res.status(404).json({ message: 'HOD not found' });
        }

        await User.deleteOne({ _id: hod._id });
        res.json({ message: 'HOD removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// HOD adds Teacher
export const addTeacher = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const department = req.user.department; // HOD can only add teachers to their own department

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const teacher = await User.create({
            name, email, password, department, role: 'teacher'
        });

        res.status(201).json({ message: 'Teacher added successfully', user: { _id: teacher._id, name: teacher.name } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// HOD deletes Teacher
export const deleteTeacher = async (req, res) => {
    try {
        const teacher = await User.findOne({ _id: req.params.id, role: 'teacher', department: req.user.department });
        
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        await User.deleteOne({ _id: teacher._id });
        res.json({ message: 'Teacher removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// HOD deletes Student
export const deleteStudent = async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.params.id, role: 'student', department: req.user.department });
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        await User.deleteOne({ _id: student._id });
        res.json({ message: 'Student removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// HOD gets all Teachers in their department
export const getTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher', department: req.user.department }).select('-password');
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// HOD adds Student
export const addStudent = async (req, res) => {
    try {
        const { name, email, password, enrolledClass } = req.body;
        const department = req.user.department;

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const student = await User.create({
            name, email, password, department, role: 'student', enrolledClass
        });

        res.status(201).json({ message: 'Student added successfully', user: { _id: student._id, name: student.name } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Teacher gets Students by Class
export const getStudentsByClass = async (req, res) => {
    try {
        const students = await User.find({ role: 'student', enrolledClass: req.params.classId }).select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
