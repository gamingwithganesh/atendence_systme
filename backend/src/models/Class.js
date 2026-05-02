import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        department: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        semester: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Class = mongoose.model('Class', classSchema);
export default Class;
