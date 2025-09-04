import ApiError from "../utils/apiError.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Comment } from "../models/comments.models.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import { Post } from "../models/posts.models.js";
import mongoose from "mongoose";
import { Follower } from "../models/followers.models.js";

const addCommentController = asyncHandler( async (req, res) => {
    const {content} = req.body
    const postId = req.params?.postId
    const userId = req.user?._id

    if(!postId || !mongoose.Types.ObjectId.isValid(postId))
        throw new ApiError(400, "Invalid request", new Error("postId not found or invalid postId"))

    if(!content || content?.trim().length == 0)
        throw new ApiError(400, "Comment should contain at least one character", new Error("Content field is empty"))

    const session = await mongoose.startSession();
    session.startTransaction();

    let response = null

    try {
        response = await Post.findById(postId, null, {session})

        if(!response || response.status==="unPublished")
            throw new ApiError(400, "Invalid Request", new Error("Post not found with passed postId or post is private"))

        if(response.status === "private"){
            response = await Follower.findOne({
                $or: [
                    {user1Id: userId, user2Id: response.ownerId},
                    {user2Id: userId, user1Id: response.ownerId},
                ]
            }, null, {session})

            if(!response)
                throw new ApiError(400, "Invalid Request", new Error("user is not authorized"))
        }

        const [createdComment] = await Comment.create([{
            postId : postId,
            ownerId: userId,
            content: content.trim()
        }],
        {session})

        response = createdComment.toObject()
        delete response.__v      
        delete response.updatedAt

        console.log("createdComment",response)

        
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
        console.log(error)
        throw new ApiError(error.statusCode.status || 500,
            error.message || "Some internal error occurred", 
            error, 
            'addComment: comments.controller.js'
        )
    }
    finally{
        session.endSession();
    }
})

const getMyAllComments = asyncHandler(async(req, res) => {
    const userId = req.params?.userId
    console.log(userId)

    const comments = await Comment.aggregate([
        {
            $match: {
                ownerId: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "posts",
                localField: "postId",
                foreignField: "_id",
                as: "postDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$postDetails"
        },
        {
            $project: {
                createdAt: 1,
                content: 1,
                postDetails: 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(
        200,
        "Comments fetched successfully",
        comments
    ))
})

const getAllCommentsForPost = asyncHandler(async(req, res) => {
    const {postId} = req.params
    let query = undefined

    const result = await Comment.aggregate([
        {
            $match: {
                postId: new mongoose.Types.ObjectId(postId),
            }
        },
        {
            $sort: {createdAt: -1, _id: -1}
        },
        {
            $lookup: {
                from: "users",
                localField: "ownerId",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                ownerDetails: 1
            }
        }
    ])

    const resultLength = result.length

    return res.status(200).json(new ApiResponse(
        200,
        "Comments fetched successfully",
        result
    ))
})

const deleteComment = asyncHandler(async(req, res) => {
    const {commentId, postId} = req.params
    const userId = req.user?._id

   if(!commentId || !postId || !mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(postId))
        throw new ApiError(400, "Invalid request", new Error("commentId not found"), 'deleteComment: comments.controller.js')

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const comment = await Comment.findOneAndDelete({_id: commentId, ownerId: userId, postId: postId}, {session})

        if(!comment)
            throw new ApiError(404, "Comment not found", new Error("Comment with given ID not found"), 'deleteComment: comments.controller.js')

        await Post.findByIdAndUpdate(
            comment.postId,
            {
                $inc: {commentsCount: -1}
            },
            {
                session,
                new: true
            }
        )

        await session.commitTransaction();

        return res.status(200).json(new ApiResponse(
            200,
            "Comment deleted successfully",
            {isDeleted: true}
        ))
    } 
    catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, "Some internal Error occurred", error, 'deleteComment: comments.controller.js')
    }
    finally{
        session.endSession();
    }
})

export {addCommentController, getAllCommentsForPost, getMyAllComments, deleteComment}

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