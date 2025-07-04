import { time } from "console";
import mongoose from "mongoose";

const subscriberSchema = mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {timestamps: true});

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);