import mongoose from "mongoose";

const trendingSchema = mongoose.Schema({
    tag: {
        type: String, 
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    impressions: {
        type: Number,
        default: 0
    }
}, {timestamps: true})

export const Trending = mongoose.model("Trending", trendingSchema)