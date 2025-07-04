import mongoose from "mongoose";

const likesSchema = mongoose.Schema({   
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

export const Like = mongoose.model('Like', likesSchema);