import SwapRequest from '../models/SwapRequest.js';
import TimetableSlot from '../models/TimetableSlot.js';

// ─── TEACHER: Create a new swap request ───────────────────────────────────────
export const createSwapRequest = async (req, res) => {
    try {
        const { targetTeacher, requestingSlot, targetSlot } = req.body;
        const requestingTeacher = req.user._id;

        if (requestingTeacher.toString() === targetTeacher) {
            return res.status(400).json({ message: 'Cannot swap with yourself' });
        }

        const swapRequest = await SwapRequest.create({
            requestingTeacher,
            targetTeacher,
            requestingSlot,
            targetSlot,
            targetTeacherStatus: 'pending',
            status: 'pending',
        });

        res.status(201).json(swapRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── TEACHER: Get MY outgoing requests (I sent these) ────────────────────────
export const getMySwapRequests = async (req, res) => {
    try {
        const requests = await SwapRequest.find({ requestingTeacher: req.user._id })
            .populate('requestingTeacher', 'name')
            .populate('targetTeacher', 'name')
            .populate({ path: 'requestingSlot', populate: { path: 'class subject' } })
            .populate({ path: 'targetSlot', populate: { path: 'class subject' } })
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── TEACHER: Get incoming requests directed at ME (I need to respond) ────────
export const getIncomingSwapRequests = async (req, res) => {
    try {
        const requests = await SwapRequest.find({
            targetTeacher: req.user._id,
            targetTeacherStatus: 'pending',   // only show ones still needing a response
        })
            .populate('requestingTeacher', 'name')
            .populate('targetTeacher', 'name')
            .populate({ path: 'requestingSlot', populate: { path: 'class subject' } })
            .populate({ path: 'targetSlot', populate: { path: 'class subject' } })
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── TEACHER: Accept incoming swap (executes the swap immediately) ─────────────
export const targetAcceptSwap = async (req, res) => {
    try {
        const { id } = req.params;
        const swapRequest = await SwapRequest.findById(id);

        if (!swapRequest) return res.status(404).json({ message: 'Request not found' });
        if (swapRequest.targetTeacher.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized to respond to this request' });
        if (swapRequest.targetTeacherStatus !== 'pending')
            return res.status(400).json({ message: 'Already responded to this request' });

        // Execute the actual slot swap
        const slot1 = await TimetableSlot.findById(swapRequest.requestingSlot);
        const slot2 = await TimetableSlot.findById(swapRequest.targetSlot);

        if (!slot1 || !slot2) return res.status(404).json({ message: 'One or both timetable slots not found' });

        const tempTeacher = slot1.teacher;
        slot1.teacher = slot2.teacher;
        slot2.teacher = tempTeacher;

        await slot1.save();
        await slot2.save();

        swapRequest.targetTeacherStatus = 'accepted';
        swapRequest.status = 'approved';
        await swapRequest.save();

        res.json({ message: 'Swap accepted and timetable updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── TEACHER: Decline incoming swap ──────────────────────────────────────────
export const targetDeclineSwap = async (req, res) => {
    try {
        const { id } = req.params;
        const swapRequest = await SwapRequest.findById(id);

        if (!swapRequest) return res.status(404).json({ message: 'Request not found' });
        if (swapRequest.targetTeacher.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized to respond to this request' });
        if (swapRequest.targetTeacherStatus !== 'pending')
            return res.status(400).json({ message: 'Already responded to this request' });

        swapRequest.targetTeacherStatus = 'declined';
        swapRequest.status = 'rejected';
        await swapRequest.save();

        res.json({ message: 'Swap declined' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── HOD / ADMIN: View ALL swap requests (history only, read-only) ────────────
export const getSwapRequests = async (req, res) => {
    try {
        const requests = await SwapRequest.find()
            .populate('requestingTeacher', 'name')
            .populate('targetTeacher', 'name')
            .populate({ path: 'requestingSlot', populate: { path: 'class subject' } })
            .populate({ path: 'targetSlot', populate: { path: 'class subject' } })
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
