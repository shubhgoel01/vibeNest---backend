import mongoose from "mongoose";

const tempSchema = mongoose.Schema({
    data: String
}, {timestamps : true})

export const Temp = mongoose.model("Temp", tempSchema);