import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    fileUrl: [{
        type: String,
        default: null,
    }],
    ownersId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    } ,
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: ['public', 'private', 'unPublished'],
        default: 'public',
    },
    subscribers : {
        type : Number,
        default: 0
    },
    likesCount: {
        type: Number,
        default: 0
    },
    commentsCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const Post = mongoose.model('Post', postSchema);
