import mongoose from "mongoose";

const likesSchema = mongoose.Schema({   
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

export const Like = mongoose.model('Like', likesSchema);