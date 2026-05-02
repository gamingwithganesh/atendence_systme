import mongoose from 'mongoose';

const timetableSlotSchema = new mongoose.Schema(
    {
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: true,
        },
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        dayOfWeek: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            required: true,
        },
        startTime: {
            type: String, // format: "09:00"
            required: true,
        },
        endTime: {
            type: String, // format: "10:00"
            required: true,
        },
        room: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

// Indexes to quickly find conflicts
timetableSlotSchema.index({ teacher: 1, dayOfWeek: 1, startTime: 1 });
timetableSlotSchema.index({ class: 1, dayOfWeek: 1, startTime: 1 });

const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema);
export default TimetableSlot;
