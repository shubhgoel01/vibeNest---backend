import ApiError from "../utils/apiError.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Comment } from "../models/comments.models.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import { Post } from "../models/posts.models.js";
import mongoose from "mongoose";

const addCommentController = asyncHandler( async (req, res) => {
    const {postId, content} = req.body
    const userId = req.user?._id

    if(!postId)
        throw new ApiError(400, "Invalid request", new Error("postId not found"), 'addComment: comments.controller.js')
    if(!userId)
        throw new ApiError(401, "Unauthorized request", new Error("userID not found"), 'addComment: comments.controller.js')

    if(!content || content?.trim().length == 0)
        throw new ApiError(400, "Comment should contain at least one character", new Error("Content field is empty"), 'addComment: comments.controller.js')

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [createdComment] = await Comment.create([{
            postId : postId,
            ownerId: userId,
            content: content.trim()
        }],
        {session})

        const response = createdComment.toObject()
        delete response.__v      
        delete response.postId
        delete response.ownerId    
        delete response._id   
        delete response.updatedAt

        
        await Post.findByIdAndUpdate( 
            postId,
            {
                $inc: {commentsCount: 1}
            },
            {
                session, 
                new: true
            }
        )

        await session.commitTransaction();

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            "Comment Successfully created",
            response
        ))
    } 
    catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, "Some internal Error occurred", new Error("Transaction Failed and rolled back"), 'addComment: comments.controller.js')
    }
    finally{
        session.endSession();
    }
})

export default addCommentController

/*
    Explanation of :
    const [response] = await Comment.create([{
            postId : postId,
            ownerId: userId,
            content: content.trim()
        }],
        {session}).toObject()

        response.delete("__v")

    
    Because we are passing an array to .create() (required for transactions) it will return an array of response,
    so simply destructure it.
    Then, now we have to know how .create works, .create create a document in the database and mongoDB appends some automatic fields like __v and updatedAt and createdAt
    and .create() returns an instance of mongoose.Document (not a json object). Now We have to convert it to json Object.For this we have two functions
        1. .lean()  Can be used only when retreiving data from databae (find)
        2. .toObject()  Can be used anywhere

    But why we are doing so, because we wants to delete extra unwanted information from the data that we do not want to send to frontEnd.
    Again we have two options for doing this.
        1. .select()    Can be used only when retreiving data from databae (find)
        2. delete       A js operator can be used only with json objects
*/