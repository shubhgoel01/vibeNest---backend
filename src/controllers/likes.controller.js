import ApiError from "../utils/apiError.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Like } from "../models/likes.models.js";
import { Post } from "../models/posts.models.js";
import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.utils.js";
import { User } from "../models/users.models.js";

const toggleLikeController = asyncHandler(async (req, res) => {
    console.log("toggleLikeController")
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
    const userIdOrName = req.params.userIdOrName
    const loggedInUserId = req.user?._id

    console.log(userIdOrName)

    const query = mongoose.isValidObjectId(userIdOrName)? {_id: userIdOrName} : {username: userIdOrName}

    const user = await User.findOne(query)
    console.log(user)

    // if(user._id != loggedInUserId)
    //     throw new ApiError(403, "You are not authorized", new Error("User not authorized"), "getAllLikedPostsForUser: likes.controller.js")

    const result = await Like.aggregate([
        {
            $match: {ownerId: new mongoose.Types.ObjectId(userIdOrName)}
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
                            "userName": 1,
                            "avatar": 1,
                            "_id": 1
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
                _id: 1,
                ownerId: 1,
                postDetails: 1,
                isLikedByLoggedInUser: { $eq: ["$ownerId", loggedInUserId] }
            }
        }

    ])
    console.log(result)

    return res.status(200).json(new ApiResponse(100, "success", result))
})

export {
    toggleLikeController,
    getAllLikedPostsForUser
}