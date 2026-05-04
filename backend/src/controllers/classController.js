import Class from '../models/Class.js';

export const addClass = async (req, res) => {
    try {
        const { name, year, semester } = req.body;
        const department = req.user.department; // HOD's department

        const classExists = await Class.findOne({ name });
        if (classExists) return res.status(400).json({ message: 'Class already exists' });

        const newClass = await Class.create({
            name, department, year, semester
        });

        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getClasses = async (req, res) => {
    try {
        const classes = await Class.find({ department: req.user.department });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const editClass = async (req, res) => {
    try {
        const { name, year, semester } = req.body;
        const updatedClass = await Class.findOneAndUpdate(
            { _id: req.params.id, department: req.user.department },
            { name, year, semester },
            { new: true }
        );

        if (!updatedClass) {
            return res.status(404).json({ message: 'Class not found' });
        }
        res.json(updatedClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
