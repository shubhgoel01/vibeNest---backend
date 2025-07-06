import mongoose from "mongoose";

const fileSchema = mongoose.Schema({
    url: String,
    public_id: String
},
{ _id: false })

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
    fileUrl:[fileSchema],
    ownersId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    } ,
    views: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['public', 'private', 'unPublished'],
        default: 'public',
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
