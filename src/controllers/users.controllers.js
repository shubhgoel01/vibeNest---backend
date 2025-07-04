import dotenv from "dotenv"
dotenv.config()

import asyncHandler from "../utils/asyncHandler.utils.js"
import { User } from "../models/users.models.js"
import ApiError from "../utils/ApiError.utils.js"
import ApiResponse from "../utils/ApiResponse.utils.js"
import jwt from "jsonwebtoken"


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

    const avatarLocalStorageUrl = req.file?.avatar?.path

    if(!avatarLocalStorageUrl)
        throw new ApiError(500, "Some internal error occurred", new Error("avatarLocalStorageUrl not found"), "registerController: users.controllers.js")

    //TODO upload to cloudinary and get the avatarLink
    let avatarUrl
    const newUser = User({
        userName,
        password,
        fullName,
        email,
        avatar: avatarUrl,
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
    const options = {
        httpOnly: true,
        secure: true
    }

    if(!refreshToken)
        throw new ApiError(400, "You have been Logged Out", new Error("No RefreshToken found"), "refreshAccessToken: user.controller.js")

    const decoded = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

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

export {
    registerController,
    loginController,
    refreshAccessToken,
    logOutUser
}