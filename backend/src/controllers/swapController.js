import SwapRequest from '../models/SwapRequest.js';
import TimetableSlot from '../models/TimetableSlot.js';

export const createSwapRequest = async (req, res) => {
    try {
        const { targetTeacher, requestingSlot, targetSlot } = req.body;
        const requestingTeacher = req.user._id; // Teacher making the request

        // Basic validation
        if (requestingTeacher.toString() === targetTeacher) {
            return res.status(400).json({ message: 'Cannot swap with yourself' });
        }

        const swapRequest = await SwapRequest.create({
            requestingTeacher,
            targetTeacher,
            requestingSlot,
            targetSlot
        });

        res.status(201).json(swapRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSwapRequests = async (req, res) => {
    try {
        // HOD gets all swap requests
        // Note: For MVP, we'll fetch all. In production, we'd filter by department teachers.
        const requests = await SwapRequest.find()
            .populate('requestingTeacher', 'name')
            .populate('targetTeacher', 'name')
            .populate({
                path: 'requestingSlot',
                populate: { path: 'class subject' }
            })
            .populate({
                path: 'targetSlot',
                populate: { path: 'class subject' }
            });
            
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const approveSwap = async (req, res) => {
    try {
        const { id } = req.params;
        const swapRequest = await SwapRequest.findById(id);
        
        if (!swapRequest) return res.status(404).json({ message: 'Request not found' });
        if (swapRequest.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        // Execute Swap logic
        const slot1 = await TimetableSlot.findById(swapRequest.requestingSlot);
        const slot2 = await TimetableSlot.findById(swapRequest.targetSlot);

        if (!slot1 || !slot2) return res.status(404).json({ message: 'One or both slots not found' });

        // Swap the teachers
        const tempTeacher = slot1.teacher;
        slot1.teacher = slot2.teacher;
        slot2.teacher = tempTeacher;

        await slot1.save();
        await slot2.save();

        swapRequest.status = 'approved';
        await swapRequest.save();

        res.json({ message: 'Swap approved and timetable updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const rejectSwap = async (req, res) => {
    try {
        const { id } = req.params;
        const swapRequest = await SwapRequest.findById(id);
        
        if (!swapRequest) return res.status(404).json({ message: 'Request not found' });
        
        swapRequest.status = 'rejected';
        await swapRequest.save();

        res.json({ message: 'Swap rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
