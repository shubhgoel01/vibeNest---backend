import mongoose from "mongoose";

const videoSchema = mongoose.Schema({
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
    videoUrl: {
        type: String,
        required: true,
    },
    thumbnailUrl: {
        type: String,
        default: null,
    },
    ownersId:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }] ,
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
}, { timestamps: true });

export const Video = mongoose.model('Video', videoSchema);
