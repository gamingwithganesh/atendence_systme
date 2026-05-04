import mongoose from 'mongoose';

const swapRequestSchema = new mongoose.Schema(
    {
        requestingTeacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetTeacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        requestingSlot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TimetableSlot',
            required: true,
        },
        targetSlot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TimetableSlot',
            required: true,
        },
        // Step 1: target teacher's decision
        targetTeacherStatus: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending',
        },
        // Step 2: overall status (auto-set after target teacher accepts/declines)
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);
export default SwapRequest;
