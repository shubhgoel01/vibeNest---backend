import mongoose from 'mongoose';

const followRequestSchema = mongoose.Schema({
    requestedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestedToUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export const FollowRequest = mongoose.model('FollowRequest', followRequestSchema);