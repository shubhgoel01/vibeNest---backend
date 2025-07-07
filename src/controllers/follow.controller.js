import asyncHandler from "../utils/asyncHandler.utils.js"
import ApiError from "../utils/apiError.utils.js"
import { FollowRequest } from "../models/followRequests.models.js"
import ApiResponse from "../utils/ApiResponse.utils.js"
import { Follower } from "../models/followers.models.js"

const createFollowRequest = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user?._id
    const { userId: targetUserId } = req.params

    if (!loggedInUserId) 
        throw new ApiError(401,"Unauthorized request",new Error("User not logged in"),"createFollowRequest: follow.controller.js")

    if (!targetUserId) 
        throw new ApiError(400,"Invalid request",new Error("Target User ID missing"),"createFollowRequest: follow.controller.js")

    if (loggedInUserId.toString() === targetUserId)
        throw new ApiError(400,"Invalid request",new Error("You cannot send a follow request to yourself"),"createFollowRequest: follow.controller.js")

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

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const followRequest = await FollowRequest.findOneAndDelete({_id: requestId,requestedToUserId: loggedInUserId},{ session })

        if (!followRequest) throw new ApiError(400,"Invalid Request",new Error("No follow request found or unauthorized action"),"acceptFollowRequest")
        
        const requestingUserId = followRequest.requestedByUserId

        await Follower.create([{userId1: loggedInUserId,user2Id: requestingUserId}],{ session })

        await session.commitTransaction()

        return res
            .status(200)
            .json(new ApiResponse(200, "Follow request accepted successfully", { isFollowed: true }))
    } 
    catch (error) {
        await session.abortTransaction()
        throw new ApiError(500,"An internal error occurred",error,"acceptFollowRequest: followers.controller.js")
    } 
    finally {
        session.endSession()
    }
})


const rejectFollowRequest = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user?._id;
    const { requestId } = req.params; 

    if (!loggedInUserId) 
        throw new ApiError(401,"Unauthorized request",new Error("User not logged in"),"rejectFollowRequest: follow.controller.js");

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
    const { userId: targetUserId } = req.params;

    if (!loggedInUserId) 
        throw new ApiError(401,"Unauthorized request",new Error("User not logged in"),"removeFollower: follow.controller.js");

    if (!targetUserId)
        throw new ApiError(400,"Invalid request",new Error("Target User ID missing"),"removeFollower: follow.controller.js");

    let response 
    response = await Follower.findOneAndDelete({
        userId1: targetUserId, // they are following me
        user2Id: loggedInUserId
    });

    if (!response) {
        response = await Follower.findOneAndDelete({
            userId1: loggedInUserId, // I am following them
            user2Id: targetUserId
        });
    }

    if (!response)
        throw new ApiError(400,"Invalid Request",new Error("No follower/following relationship found"),"removeFollower")

    return res.status(200).json(
        new ApiResponse(
            200,
            "User unfollowed or removed as follower successfully",
            { isUnFollowed: true }
        )
    );
});


const getAllFollowersForUser = asyncHandler(async(req, res) => {
    const loggedInUserID = req.user?._id
    

    const result = await Follower.aggregate([
        { $match: { 
            $or: [
                { user1Id: userId },
                { user2Id: userId }
            ]}
        },
        {
            $addFields: {
            targetUserId: {
                $cond: {
                    if: { $eq: ["$user1Id", loggedInUserID] },
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
            $sort: { "$userDetails.userName": 1 }
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
    const loggedInUserId = req.params.userId

    // const result = Follower.find({       //Getting error here, do not know why, saw from (count in mongodb)
    //     $or: [
    //         {user1Id: loggedInUserId},
    //         {user2Id: loggedInUserId}
    //     ]
    // }).count()

    const result = await Follower.where({
        $or:[
            {user1Id: loggedInUserId},
            {user2Id: loggedInUserId}
        ]
    }).countDocuments()

    //https://mongoosejs.com/docs/api/query.html#Query.prototype.countDocuments()

    return res.status(200).json(ApiResponse(200, "Followers Counted Successfully", {followersCount: result}))
})

const getAllFollowRequestsSent = asyncHandler(async(req, res)=>{
    const loggedInUserId = req.user?._id

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

export {
    createFollowRequest, 
    acceptFollowRequest, 
    rejectFollowRequest, 
    getAllFollowersForUser, 
    allFollowRequestsReceived, 
    getAllFollowersCount, 
    getAllFollowRequestsSent,
    removeFollower
}