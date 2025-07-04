import mongoose from 'mongoose';

const commentSchema = mongoose.Schema({
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxLength: [500, 'Comment cannot exceed 500 characters'],
        minLength: [1, 'Comment must have at least 1 character'],
    }
})

export const Comment = mongoose.model('Comment', commentSchema);