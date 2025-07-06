import express from 'express';

const followRequestSchema = new express.Schema({
    requestedByUserId: {
        type: express.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestedToUserId: {
        type: express.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export const FollowRequest = express.model('FollowRequest', followRequestSchema);