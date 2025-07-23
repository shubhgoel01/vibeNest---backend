import dotenv from "dotenv"
dotenv.config()

import asyncHandler from "../utils/asyncHandler.utils.js"
import { User } from "../models/users.models.js"
import ApiError from "../utils/apiError.utils.js"
import ApiResponse from "../utils/ApiResponse.utils.js"
import jwt from "jsonwebtoken"
import {uploadOnCloudinary} from "../utils/cloudinary.utils.js"
import { FollowRequest } from "../models/followRequests.models.js"
import { Follower } from "../models/followers.models.js"
import mongoose from "mongoose"


const registerController = asyncHandler(async (req, res) => {
    const {userName, password, fullName, email} = req.body
    const options = {
        httpOnly: true,
        secure: true
    }

    if(!userName || !password || !fullName || !email)
        throw new ApiError(400, "All fields are required" ,{}, "registerController: users.controllers.js")

    let user = await User.findOne({userName})
    if(user)
        throw new ApiError(400, "User with userName already exist" ,{}, "registerController: users.controllers.js")

    user = await User.findOne({email})
    if(user)
        throw new ApiError(400, "User with email already exists", {}, "registerController: users.controllers.js")

    const avatarLocalStorageUrl = await req.file?.path
    if(!avatarLocalStorageUrl)
        throw new ApiError(500, "Some internal error occurred", new Error("avatarLocalStorageUrl not found"), "registerController: users.controllers.js")


    let cloudinaryResponse = await uploadOnCloudinary(avatarLocalStorageUrl)


    const newUser = new User({
        userName,
        password,
        fullName,
        email,
        avatar: {url: cloudinaryResponse.secure_url, public_id: cloudinaryResponse.public_id},
    })

    const newRefreshToken = await newUser.generateRefreshToken()
    const newAccessToken = await newUser.generateAccessToken()
    if(!newRefreshToken || !newAccessToken)
        throw new ApiError(401, "Some Internal Error occurred", new Error("Tokens failed to generate"), "loginController: users.controllers.js")

    newUser.refreshToken = newRefreshToken

    const savedUser = await newUser.save()
    if(!savedUser)
        throw ApiError(500, "Registration failed", new Error("avatarLocalStorageUrl not found"), "registerController: users.controllers.js")


    const loggedInUser = savedUser.toObject();
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;


    return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(
            201, 
            "User successfuly registered", 
            {
            user: loggedInUser, accessToken: newAccessToken, refreshToken: newRefreshToken
            }
        ))
})

const loginController = asyncHandler(async(req, res) => {
    const {password, email, userName} = req.body
    const options = {
        httpOnly: true,
        secure: true
    }

    if((!email && !userName) || !password)
        throw new ApiError(400, "All fields are required" ,{}, "loginController: users.controllers.js")

    const query = email ? { email } : { userName };

    const user = await User.findOne(query)
    if(!user)
        throw new ApiError(404, "no user found", new Error("User not found"), "loginController: users.controllers.js")

    if(! await user.isPasswordCorrect(password))
        throw new ApiError(401, "email and passwor does not match" ,Error("Password is not correct"), "loginController: users.controllers.js")

    const newRefreshToken = await user.generateRefreshToken()
    const newAccessToken = await user.generateAccessToken()

    if(!newRefreshToken || !newAccessToken)
        throw new ApiError(401, "Some Internal Error occurred", new Error("Tokens failed to generate"), "loginController: users.controllers.js")

    const loggedInUser = await User.findByIdAndUpdate(user._id, {refreshToken: newRefreshToken}, {new: true}).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(
        200,
        "user logged in successfuly",
        {
            user: loggedInUser, accessToken: newAccessToken, refreshToken: newRefreshToken
        }
    ))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.header("Autorization")?.replace("Bearer ", "")
    console.log(refreshToken)
    const options = {
        httpOnly: true,
        secure: true
    }


    if(!refreshToken)
        throw new ApiError(400, "You have been Logged Out", new Error("No RefreshToken found"), "refreshAccessToken: user.controller.js")
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

    const userId = decoded._id
    const user = await User.findById(userId)

    if(!user)
        throw new ApiError(400, "You have been Logged Out", new Error("No User Found"), "refreshAccessToken: user.controller.js")

    if( user.refreshToken !== refreshToken )
        throw new ApiError(400, "You have been Logged Out", new Error("RefreshToekn does not match"), "refreshAccessToken: user.controller.js")
    const newRefreshToken = await user.generateRefreshToken()
    const newAccessToken = await user.generateAccessToken()

    if(!newRefreshToken || !newAccessToken)
        throw new ApiError(401, "Some Internal Error occurred", new Error("Tokens failed to generate"), "loginController: users.controllers.js")

    const loggedInUser = await User.findByIdAndUpdate(user._id, {refreshToken: newRefreshToken}, {new: true}).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(
        200,
        "user logged in successfuly",
        {
            user: loggedInUser, accessToken: newAccessToken, refreshToken: newRefreshToken
        }
    ))
})

//User specific tasks

const logOutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const options = {
        httpOnly: true,
        secure: true
    }

    await User.findByIdAndUpdate(userId, {
        $set: {
            refreshToken: undefined
        }
    },
    {new: true})

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out Successfuly"))
})

const getUserDetailsByUserIdOrUserName = asyncHandler(async(req, res) => { 
    const loggedInUserId = req.user?._id
    let query = undefined

    if(!loggedInUserId)
        throw new ApiError(401, "Please Login To Continue", new Error("User is not-logged in"), "getUserDetailsByUserIdOrUserName: users.controllers.js")

    const searchUserId_UserName = req.params?.userId_Name
    console.log("searchUserId_UserName", searchUserId_UserName)
    if(!searchUserId_UserName)
        throw new ApiError(404, "Invalid Request", new Error("searchUserId_UserName id not found"), "getUserDetailsByUserIdOrUserName: users.controllers.js")
    
    if(mongoose.Types.ObjectId.isValid(searchUserId_UserName))
        query = {_id: new mongoose.Types.ObjectId(searchUserId_UserName)}
    else query = { userName: searchUserId_UserName }

    //Note: If we pass both the queries using $or operator, then it is fine BUT {_id: searchUserId_UserName} throws an error if searchUserId_UserName is not a valid ObjectId
    //Hence update code like this

    const searchedUser = await User.aggregate([
        {
            $match: query
        },
        {
            $lookup: {
                from: "followers",
                localField: "_id",
                foreignField: "user2Id",
                as: "followers"
            }
        },
        {
            $lookup: {
                from: "followrequests",
                localField: "_id",
                foreignField: "userId",
                as: "followRequests"
            }
        },
        {
            $addFields: {
                isFollowedByLoggedInUser: {
                    $cond: {
                        if: {$size: "$followers"},
                        then: true,
                        else: false
                    }
                },
                isFollowRequestSentByLoggedInUser: {
                    $eq: ["followRequests[0].requestedByUserId", loggedInUserId]
                    /*
                        This line is very important, and critical, It should be noted that 'followers' and 'followRequests' can contain atmost 1 element
                        Now we have two cases
                            1. User contains one value - then clearly line executed safely
                            2. Array is empty - followRequests[0].requestedByUserId resolves to undefined, not causing/throwing any error
                        Also, we have already checked that 'loggedInUserId' is not null or undefined

                        NOTE: "followRequests?[0].requestedByUserId"    give error here
                    */
                },
                isFollowRequestReceivedByLoggedInUser: {
                    $eq: ["followRequests[0].requestedToUserId", loggedInUserId]
                }
            }
        },
        {
            $project: {
                "_id": 1,
                "userName": 1,
                "email": 1,
                "fullName": 1,
                "avatar": 1,
                "followersCount": 1,
                "createdAt": 1,
                "isFollowedByLoggedInUser": 1,
                "isFollowRequestSentByLoggedInUser": 1,
                "isFollowRequestReceivedByLoggedInUser": 1
            }
        }
    ])

    console.log("searchedUser", searchedUser)

    return res
        .status(200)
        .json(new ApiResponse(200, "User Fetched Succesfully", ...searchedUser))
        
})

export {
    registerController,
    loginController,
    refreshAccessToken,
    logOutUser,
    getUserDetailsByUserIdOrUserName
}


//TODO =>  getUserDetailsByID (include functionalities like isFollowed), getMyDetails, profileUpdateFunctions