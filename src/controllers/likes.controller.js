import ApiError from "../utils/apiError.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Like } from "../models/likes.models.js";
import { Post } from "../models/posts.models.js";
import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.utils.js";

const toggleLikeController = asyncHandler(async (req, res) => {
    const {postId} = req.body
    const loggedInUserId = req.user?._id

    if(!loggedInUserId)
        throw new ApiError(401, "You are not authorized", new Error("UserID not found"),"toggleLikeController: likes.controller.js")
    if(!postId)
        throw new ApiError(400, "Invalid Request", new Error("Post Id not found"),"toggleLikeController: likes.controller.js")

    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        const likeIdIfAlreadyLiked = await Like.findOne({postId: postId, ownerId: loggedInUserId})
        const isLiked = !!likeIdIfAlreadyLiked

        if(isLiked)
            await Like.findByIdAndDelete(likeIdIfAlreadyLiked._id, { session })
        else
            await Like.create([{postId: postId, ownerId: loggedInUserId}], {session})

        await Post.findByIdAndUpdate(
            postId,
            {
                $inc: {likesCount: isLiked? -1: 1}
            },
            {
                session,
                new:true
            }
        )

        await session.commitTransaction();

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                "Post Like Toggled Successfully",
                {isLiked: !isLiked}
            ))
    }
    catch(error){
        await session.abortTransaction();
        throw new ApiError(500, "Failed to Toggle the like", error, 'toggleLikeController: likes.controller.js')
    }
    finally{
        session.endSession();
    }

})

const getAllLikedPostsForUser = asyncHandler(async(req, res) => {
    
})

export {
    toggleLikeController,
    getAllLikedPostsForUser
}