import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.utils.js";

export const connectDB = async () => {
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) 
        throw new ApiError(500,"Database URL is not defined in environment variables",{}, "connectDB : index.db.js");

    const response = await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

    console.log("Database connected successfully:", response.connection.name);
}

export default connectDB;
