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
