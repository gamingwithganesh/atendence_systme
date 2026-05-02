import User from '../models/User.js';
import Class from '../models/Class.js';
import TimetableSlot from '../models/TimetableSlot.js';
import SwapRequest from '../models/SwapRequest.js';

export const getDashboardStats = async (req, res) => {
    try {
        let matchCondition = {};
        let classMatch = {};
        if (req.user.role === 'hod') {
            matchCondition = { department: req.user.department };
        }

        const totalStudents = await User.countDocuments({ role: 'student', ...matchCondition });
        const totalTeachers = await User.countDocuments({ role: 'teacher', ...matchCondition });
        const activeClasses = await Class.countDocuments(matchCondition);
        
        const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
        
        let todaysLectures = 0;
        let upcomingClasses = [];
        let recentActivity = [];

        if (req.user.role === 'hod') {
            const classIds = await Class.find(matchCondition).select('_id');
            const cIds = classIds.map(c => c._id);
            classMatch = { class: { $in: cIds } };
            
            todaysLectures = await TimetableSlot.countDocuments({ 
                ...classMatch,
                dayOfWeek: currentDay
            });

            upcomingClasses = await TimetableSlot.find({ ...classMatch, dayOfWeek: currentDay })
                .populate('subject', 'name')
                .populate('class', 'name')
                .populate('teacher', 'name')
                .sort({ startTime: 1 })
                .limit(3);
            
            // For activity: get recent slots
            const recentSlots = await TimetableSlot.find(classMatch)
                .populate('class', 'name')
                .populate('subject', 'name')
                .sort({ updatedAt: -1 })
                .limit(2);

            recentActivity = recentSlots.map(slot => ({
                id: slot._id,
                message: `Timetable for ${slot.class?.name} updated with ${slot.subject?.name}.`,
                time: slot.updatedAt,
                type: 'timetable'
            }));

            // Get recent swaps
            const recentSwaps = await SwapRequest.find({
                // assuming swap targets involve this department's teachers
            }).populate('requestingTeacher', 'name')
              .populate('targetTeacher', 'name')
              .sort({ updatedAt: -1 })
              .limit(2);
            
            recentSwaps.forEach(swap => {
                recentActivity.push({
                    id: swap._id,
                    message: `Swap ${swap.status}: ${swap.requestingTeacher?.name} & ${swap.targetTeacher?.name}.`,
                    time: swap.updatedAt,
                    type: 'swap'
                });
            });

        } else {
            // Admin logic
            todaysLectures = await TimetableSlot.countDocuments({ dayOfWeek: currentDay });
            
            upcomingClasses = await TimetableSlot.find({ dayOfWeek: currentDay })
                .populate('subject', 'name')
                .populate('class', 'name')
                .populate('teacher', 'name')
                .sort({ startTime: 1 })
                .limit(3);
                
            const recentSlots = await TimetableSlot.find({})
                .populate('class', 'name')
                .populate('subject', 'name')
                .sort({ updatedAt: -1 })
                .limit(3);

            recentActivity = recentSlots.map(slot => ({
                id: slot._id,
                message: `Timetable for ${slot.class?.name} updated with ${slot.subject?.name}.`,
                time: slot.updatedAt,
                type: 'timetable'
            }));
        }

        // Sort combined activity by time
        recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({
            totalStudents,
            totalTeachers,
            activeClasses,
            todaysLectures,
            upcomingClasses,
            recentActivity: recentActivity.slice(0, 4)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
