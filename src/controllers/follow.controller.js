import asyncHandler from "../utils/asyncHandler.utils.js"
import ApiError from "../utils/apiError.utils.js"
import { FollowRequest } from "../models/followRequests.models.js"
import ApiResponse from "../utils/apiResponse.utils.js"
import { Follower } from "../models/followers.models.js"
import mongoose from "mongoose"

const createFollowRequest = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user?._id
    const { userId: targetUserId } = req.params

    if (!targetUserId){
        console.log("targetUserId not found") 
        throw new ApiError(400,"Invalid request",new Error("Target User ID missing"),"createFollowRequest: follow.controller.js")}

    if (loggedInUserId.toString() === targetUserId){
        console.log("loggedInUser == requestedUser")
        throw new ApiError(400,"Invalid request",new Error("You cannot send a follow request to yourself"),"createFollowRequest: follow.controller.js")}

    const existingRequest = await FollowRequest.findOne({
        requestedByUserId: loggedInUserId,
        requestedToUserId: targetUserId
    })

    if (existingRequest) 
        throw new ApiError(409,"Follow request already sent",new Error("Duplicate follow request"),"createFollowRequest: follow.controller.js")
    

    const alreadyFollowing = await Follower.findOne({
        userId1: loggedInUserId,
        user2Id: targetUserId
    })

    if (alreadyFollowing) 
        throw new ApiError(409,"You already follow this user",new Error("Duplicate follower"),"createFollowRequest: follow.controller.js")

    await FollowRequest.create({
        requestedByUserId: loggedInUserId,
        requestedToUserId: targetUserId
    })

    return res.status(201).json(
        new ApiResponse(
            201,
            "Follow request sent successfully",
            { isRequested: true }
        )
    )
})


const acceptFollowRequest = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user?._id
    const { requestId } = req.params

    if(!requestId || !mongoose.Types.ObjectId.isValid(requestId))
        throw new ApiError(400, "invalid requestId")

    try {
        const followRequest = await FollowRequest.findOneAndDelete({_id: requestId, requestedToUserId: loggedInUserId})

        if (!followRequest) 
            throw new ApiError(400,"Invalid Request",new Error("No follow request found or unauthorized action"),"acceptFollowRequest")
        
        await Follower.create({user1Id: loggedInUserId,user2Id: followRequest.requestedByUserId})

        return res
            .status(200)
            .json(new ApiResponse(200, "Follow request accepted successfully", { isFollowed: true }))
    } 
    catch (error) {
        console.log(error)
        throw new ApiError(500,"An internal error occurred",error,"acceptFollowRequest: followers.controller.js")
    }
})


const rejectFollowRequest = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user?._id;
    const { requestId } = req.params; 

    if(!requestId || !mongoose.Types.ObjectId.isValid(requestId))
        throw new ApiError(400, "invalid requestId")

    const followRequest = await FollowRequest.findOneAndDelete({
        _id: requestId, 
        requestedToUserId: loggedInUserId
    });

    if (!followRequest) 
        throw new ApiError(400,"Invalid Request",new Error("No follow request found or unauthorized action"),"rejectFollowRequest");

    return res.status(200).json(
        new ApiResponse(
            200,
            "Follow request rejected successfully",
            { isRejected: true }
        )
    );
});


const removeFollower = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user?._id;
    const followId = req.params.followId;

    if (!followId || !mongoose.Types.ObjectId.isValid(followId))
        throw new ApiError(400,"Invalid request1",new Error("Target User ID missing"),"removeFollower: follow.controller.js");

    let response 
    response = await Follower.findOneAndDelete({
        _id: followId,
        $or: [
            {"user1Id": loggedInUserId},
            {"user2Id": loggedInUserId}
        ]
    });

    if (!response)
        throw new ApiError(400,"Invalid Request2",new Error("No follower/following relationship found"),"removeFollower")

    return res.status(200).json(
        new ApiResponse(
            200,
            "User unfollowed or removed as follower successfully",
            { isUnFollowed: true }
        )
    );
});


const getAllFollowersForUser = asyncHandler(async(req, res) => {
    const userId = req.params.userId
    console.log("getAllFollowersForUser called")
    console.log("input userId", userId)

    const result = await Follower.aggregate([
        { $match: { 
            $or: [
                { user1Id: new mongoose.Types.ObjectId(userId) },
                { user2Id: new mongoose.Types.ObjectId(userId) }
            ]}
        },
        {
            $addFields: {
            targetUserId: {
                $cond: {
                    if: { $eq: ["$user1Id", userId] },
                    then: "$user2Id",
                    else: "$user1Id"
                    }
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "targetUserId",
                foreignField: "_id",
                as: "userDetails", 
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            profilePicture: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $sort: { "userDetails.userName": 1 }
        },
        {
            $project: {
                userDetails: 1,
                _id: 1,
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, "Followers fetched successfully", result))
})
//We can also add pagination to this
 
const getAllFollowersCount = asyncHandler(async(req, res) => {
    const userId = req.params.userId

    const result = await Follower.where({
        $or:[
            {user1Id: userId},
            {user2Id: userId}
        ]
    }).countDocuments()

    //https://mongoosejs.com/docs/api/query.html#Query.prototype.countDocuments()

    return res.status(200).json(new ApiResponse(200, "Followers Counted Successfully", {followersCount: result}))
})

const getAllFollowRequestsSent = asyncHandler(async(req, res)=>{
    const loggedInUserId = req.user?._id
    const userId = new mongoose.Types.ObjectId(req.params.userId)

    // if(loggedInUserId !== userId)
    //         throw new ApiError(404, "You Are not Authorized")

    const result = await FollowRequest.aggregate([
        {
            $match: {requestedByUserId: loggedInUserId}
        },
        {
        $lookup: {
        from: "users",
                localField: "requestedToUserId",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            "_id": 1,
                            "userName": 1,
                            "avatar": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                "userDetails": 1,
                 "createdAt": 1,
                "_id": 1
            }
        }
        ])
    
        return res.status(200).json(new ApiResponse(200, "Data fetched", result))
})

const allFollowRequestsReceived = asyncHandler(async(req, res)=>{
    const loggedInUserId = req.user?._id
    const userId = new mongoose.Types.ObjectId(req.params.userId)

    // if(userId !==loggedInUserId)
    //     throw new ApiError(404, "Unauthorized request")

    const result = await FollowRequest.aggregate([
        {
            $match: {requestedToUserId: loggedInUserId}
        },
        {
            $lookup: {
                from: "users",
                localField: "requestedByUserId",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            "_id": 1,
                            "userName": 1,
                            "avatar": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                "userDetails": 1,
                "createdAt": 1,
                "_id": 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, "Data fetched", result))
})

const cancelFollowRequest = asyncHandler(async(req, res) => {
    console.log("Remove follow request called")
    const requestId = req.params.requestId
    const loggedInUserId = req.user?._id

    console.log("requestId", requestId)
    console.log("loggedInUserId", loggedInUserId)


    if(!requestId || !mongoose.Types.ObjectId.isValid(requestId))
        throw new ApiError(400, "Invalid Request")

    const response = await FollowRequest.findOneAndDelete({
        _id: requestId,
        requestedByUserId: loggedInUserId
    })

    if(!response)
        throw new ApiError(400, "No followRequest found")

    return res.status(200).json({isCancelled : true})
})

export {
    createFollowRequest, 
    acceptFollowRequest, 
    rejectFollowRequest, 
    getAllFollowersForUser, 
    allFollowRequestsReceived, 
    getAllFollowersCount, 
    getAllFollowRequestsSent,
    removeFollower,
    cancelFollowRequest
}