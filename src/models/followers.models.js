import express from 'express';

const followerSchema = new express.Schema({
    user1Id: {
        type: express.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    user2Id: {
        type: express.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

export const Follower = express.model('Follower', followerSchema);