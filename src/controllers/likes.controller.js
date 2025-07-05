import ApiError from "../utils/apiError.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Like } from "../models/likes.models.js";
import { Post } from "../models/posts.models.js";

const likeController = asyncHandler(async (req, res) => {
    const {postId} = req.body
    const userId = req.user?._id

    if(!userId)
        throw ApiError(401, "You are not authorized", new Error("UserID not found"),"likeController: likes.controller.js")
    if(!postId)
        throw ApiError(400, "Invalid Request", new Error("Post Id not found"),"likeController: likes.controller.js")

    const existingLike = await Like.findOne({ postId, ownerId: userId });
    if(existingLike) 
        throw ApiError(400, "You have already liked this post", new Error("Duplicate like"), "likeController: likes.controller.js");

    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        const [response] = await Like.create([{
                    postId : postId,
                    ownerId: userId
                }],
                {session})

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                $inc: {likesCount: 1}
            },
            {
                session,
                new:true
            }
        )   
        
        await session.commitTransaction();
        session.endSession();

        return res
                .status(201)
                .json(ApiResponse(
                    201,
                    "post Liked Successfully",
                    {response, updatedPost}
                ))
    }
    catch(error){
        await session.abortTransaction();
        session.endSession();

        throw ApiError(500, "Failed to like the post", error, 'likeController: likes.controller.js')

    }
})

const unlikeController = asyncHandler (async (req, res) => {
    const {postId} = req.body;
    const userId = req.user?._id

    if(!userId)
        throw ApiError(401, "You are not authorized", new Error("UserID not found"),"unlikeController: likes.controller.js")
    if(!postId)
        throw ApiError(400, "Invalid Request", new Error("Post Id not found"),"unlikeController: likes.controller.js")


    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        const likeInstance = await Like.findOne({ownerId: userId, postId: postId})
        if(!likeInstance)
            throw ApiError(400, "You have not liked the reel", new Error("No LikeInstance found matching the userId and postId"), "unlikeController: like.controller.js")
        
        await Like.findByIdAndDelete(likeInstance._id, { session })
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                $inc: {likesCount: -1}
            },
            {
                session,
                new:true
            }
        )   
        
        await session.commitTransaction();
        session.endSession();

        return res
                .status(200)
                .json(ApiResponse(
                    200,
                    "Post Unliked Successfully",
                    updatedPost
                ))
    }
    catch(error){
        await session.abortTransaction();
        session.endSession();

        throw ApiError(500, "Failed to unlike the post", error, 'unlikeController: likes.controller.js')

    }
})

export {
    likeController,
    unlikeController
}