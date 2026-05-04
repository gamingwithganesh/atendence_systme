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

const timeToMins = (timeStr) => {
    const [h, m] = timeStr.split(':');
    return parseInt(h) * 60 + parseInt(m);
};

const minsToTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const moveSlot = async (req, res) => {
    try {
        const { sourceSlotId, targetDay, targetTime } = req.body;
        
        const sourceSlot = await TimetableSlot.findById(sourceSlotId).populate('subject');
        if (!sourceSlot) return res.status(404).json({ message: 'Source slot not found' });

        const originalDay = sourceSlot.dayOfWeek;
        const originalStartMins = timeToMins(sourceSlot.startTime);
        
        const sourceDurationMins = sourceSlot.subject?.duration || 60;
        const targetStartMins = timeToMins(targetTime);
        const targetEndMins = targetStartMins + sourceDurationMins;
        const newSourceEndTime = minsToTime(targetEndMins);

        // Find all slots in target location that overlap with new source slot boundary
        const allTargetSlots = await TimetableSlot.find({
            class: sourceSlot.class,
            dayOfWeek: targetDay,
            _id: { $ne: sourceSlot._id }
        }).populate('subject');

        const overlappingTargetSlots = allTargetSlots.filter(slot => {
            const slotStart = timeToMins(slot.startTime);
            const slotEnd = timeToMins(slot.endTime);
            return Math.max(slotStart, targetStartMins) < Math.min(slotEnd, targetEndMins);
        });

        // 1. Check teacher conflict for the sourceSlot's new position
        const sourceTeacherSlots = await TimetableSlot.find({
            teacher: sourceSlot.teacher,
            dayOfWeek: targetDay,
            _id: { $ne: sourceSlot._id }
        });
        
        const hasSourceConflict = sourceTeacherSlots.some(slot => {
            return Math.max(timeToMins(slot.startTime), targetStartMins) < Math.min(timeToMins(slot.endTime), targetEndMins);
        });

        if (hasSourceConflict) {
            return res.status(400).json({ message: 'Teacher conflict for moving source slot' });
        }

        // 2. Compute new positions for overlapping target slots (move them to source's original space)
        let currentStartMins = originalStartMins;
        const targetUpdates = [];

        for (let target of overlappingTargetSlots) {
            const targetDurationMins = target.subject?.duration || 60;
            const targetSlotEndMins = currentStartMins + targetDurationMins;
            
            const newStart = minsToTime(currentStartMins);
            const newEnd = minsToTime(targetSlotEndMins);
            
            // Check teacher conflict for this target slot in its new position
            const targetTeacherSlots = await TimetableSlot.find({
                teacher: target.teacher,
                dayOfWeek: originalDay,
                _id: { $ne: target._id, $ne: sourceSlot._id }
            });
            
            const hasTargetConflict = targetTeacherSlots.some(slot => {
                return Math.max(timeToMins(slot.startTime), currentStartMins) < Math.min(timeToMins(slot.endTime), targetSlotEndMins);
            });
            
            if (hasTargetConflict) {
                return res.status(400).json({ message: `Teacher conflict for swapped slot: ${target.subject?.name}` });
            }
            
            targetUpdates.push({
                slot: target,
                dayOfWeek: originalDay,
                startTime: newStart,
                endTime: newEnd
            });
            
            currentStartMins = targetSlotEndMins;
        }

        // Apply updates
        sourceSlot.dayOfWeek = targetDay;
        sourceSlot.startTime = targetTime;
        sourceSlot.endTime = newSourceEndTime;
        await sourceSlot.save();

        for (let update of targetUpdates) {
            update.slot.dayOfWeek = update.dayOfWeek;
            update.slot.startTime = update.startTime;
            update.slot.endTime = update.endTime;
            await update.slot.save();
        }

        return res.json({ message: 'Slots moved successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
