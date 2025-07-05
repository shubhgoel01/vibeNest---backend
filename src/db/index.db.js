import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import ApiError from "../utils/apiError.utils.js";
import { Comment } from "../models/comments.models.js";

const createCollections = async (models) => {
  await Promise.all(
      models.map((model) => model.createCollection())
  );
};

export const connectDB = async () => {
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) 
        throw new ApiError(500,"Database URL is not defined in environment variables",{}, "connectDB : index.db.js");

    const response = await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

    console.log("Database connected successfully:", response.connection.name);

    //Create collections
    await createCollections([Comment, Like]);

}

export default connectDB;

/*
    Updated the code to create database collections : 
    When performing MongoDB queries without transactions, you don't need to create the collections because they are created 
    automatically when we insert the first document.

    You have to do it manually on a replica set; otherwise, transactions will not work. 
    We only need to create the collection for those models that include are included in 'transactions'.

    Code source -> https://blog.tericcabrel.com/how-to-use-mongodb-transaction-in-node-js/
*/
