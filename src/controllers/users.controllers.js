import dotenv from "dotenv";
dotenv.config();

import asyncHandler from "../utils/asyncHandler.utils.js";
import { User } from "../models/users.models.js";
import ApiError from "../utils/apiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import { FollowRequest } from "../models/followRequests.models.js";
import { Follower } from "../models/followers.models.js";
import mongoose from "mongoose";

const registerController = asyncHandler(async (req, res) => { 
  const { userName, password, fullName, email } = req.body;
  console.log("register controller called")

  const options = {
        httpOnly: true,
        secure: true,
    };

  if (!userName || !password || !fullName || !email) {
    throw new ApiError(400, "All fields are required", {}, "registerController: users.controllers.js");
  }

  let user = await User.findOne({ userName });
  if (user) {
    throw new ApiError(400, "User with userName already exist", {}, "registerController: users.controllers.js");
  }

  user = await User.findOne({ email });
  if (user) {
    throw new ApiError(400, "User with email already exists", {}, "registerController: users.controllers.js");
  }

  const avatarLocalStorageUrl = req.file?.path;
  if (!avatarLocalStorageUrl) {
    throw new ApiError(500, "Some internal error occurred", new Error("avatarLocalStorageUrl not found"), "registerController: users.controllers.js");
  }

  const cloudinaryResponse = await uploadOnCloudinary(avatarLocalStorageUrl);

  const newUser = new User({
    userName,
    password,
    fullName,
    email,
    avatar: {
      url: cloudinaryResponse.secure_url,
      public_id: cloudinaryResponse.public_id,
    },
  });

  const newRefreshToken = await newUser.generateRefreshToken();
  const newAccessToken = await newUser.generateAccessToken();
  if (!newRefreshToken || !newAccessToken) {
    throw new ApiError(401, "Some Internal Error occurred", new Error("Tokens failed to generate"), "registerController: users.controllers.js");
  }

  newUser.refreshToken = newRefreshToken;

  const savedUser = await newUser.save();
  if (!savedUser) {
    throw new ApiError(500, "Registration failed", new Error("User not saved"), "registerController: users.controllers.js");
  }

  const loggedInUser = savedUser.toObject();
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  return res
    .status(201)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(201, "User successfully registered", {
        user: loggedInUser,              // ✅ object
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      })
    );
});


const loginController = asyncHandler(async (req, res) => {
  console.log("Login called")
  const { password, email, userName } = req.body;
  console.log("Login controller called")
  console.log(password)
  console.log(email)


  const options = {
        httpOnly: true,
        secure: true,
    };

  if ((!email && !userName) || !password) {
    throw new ApiError(400, "All fields are required", {}, "loginController: users.controllers.js");
  }

  const query = email ? { email } : { userName };
  console.log(query)
  const user = await User.findOne(query);
  console.log(user)
  if (!user) {
    throw new ApiError(404, "no user found", new Error("User not found"), "loginController: users.controllers.js");
  }

  if (!(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "email and password does not match", Error("Password is not correct"), "loginController: users.controllers.js");
  }

  const newRefreshToken = await user.generateRefreshToken();
  const newAccessToken = await user.generateAccessToken();
  if (!newRefreshToken || !newAccessToken) {
    throw new ApiError(401, "Some Internal Error occurred", new Error("Tokens failed to generate"), "loginController: users.controllers.js");
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken }, {new: true});
  console.log("Updated User", updatedUser)

  const loggedInUserArr = await User.aggregate([
    { $match: { _id: user._id } },
    {
      $project: {
        _id: 1,                 // ✅ fix __id -> _id
        userName: 1,
        email: 1,
        fullName: 1,
        followersCount: 1,
        createdAt: 1,
        updatedAt: 1,
        avatar: 1,
      },
    },
  ]);
  const loggedInUser = loggedInUserArr[0] || null; // ✅ normalize to object
  
  console.log("newAccressToken", newAccessToken)
  console.log("newRefreshToken", newRefreshToken)

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200, "user logged in successfully", {
        user: loggedInUser,             // ✅ object (not array)
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      })
    );
});


const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  const options = {
        httpOnly: true,
        secure: true,
    };

  if (!refreshToken) {
    console.log("refresh token not found");
    throw new ApiError(400, "Resfresh Token not Found", {}, "refreshAccessToken");
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  const userId = decoded._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "You have been Logged Out", {}, "refreshAccessToken");
  }

  if (user.refreshToken !== refreshToken) {
    console.log("DB RefreshToken", user.refreshToken);
    console.log("Incoming RefreshToken", refreshToken);
    throw new ApiError(400, "You have been Logged Out", {}, "refreshAccessToken");
  }

  const newRefreshToken = await user.generateRefreshToken();
  const newAccessToken = await user.generateAccessToken();

  await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

  const loggedInUserArr = await User.aggregate([
    { $match: { _id: user._id } },
    {
      $project: {
        _id: 1,
        userName: 1,
        email: 1,
        fullName: 1,
        followersCount: 1,
        createdAt: 1,
        updatedAt: 1,
        avatar: 1,
      },
    },
  ]);
  const loggedInUser = loggedInUserArr[0] || null;

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200, "user refreshed successfully", {
        user: loggedInUser,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      })
    );
});



//User specific tasks

const logOutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const options = {
        httpOnly: true,
        secure: true,
    };

  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfuly"));
});

const getUserDetailsByUserIdOrUserName = asyncHandler(async (req, res) => {
  console.log("Fetch users called")
  const loggedInUserId = req.user?._id;
  let query = undefined;

  if (!loggedInUserId)
    throw new ApiError(
      401,
      "Please Login To Continue",
      new Error("User is not-logged in"),
      "getUserDetailsByUserIdOrUserName: users.controllers.js"
    );

  const searchUserId_UserName = req.params?.userId_Name;
  console.log("searchUserId_UserName", searchUserId_UserName)
  if (!searchUserId_UserName)
    throw new ApiError(
      404,
      "Invalid Request",
      new Error("searchUserId_UserName id not found"),
      "getUserDetailsByUserIdOrUserName: users.controllers.js"
    );

  if (mongoose.Types.ObjectId.isValid(searchUserId_UserName))
    query = { _id: new mongoose.Types.ObjectId(searchUserId_UserName) };
  else query = { userName: searchUserId_UserName };

  //Note: If we pass both the queries using $or operator, then it is fine BUT {_id: searchUserId_UserName} throws an error if searchUserId_UserName is not a valid ObjectId
  //Hence update code like this

  const searchedUser = await User.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "followers",
        let: { searchedUserId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      { $eq: ["$user1Id", "$$searchedUserId"] },
                      { $eq: ["$user2Id", loggedInUserId] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ["$user2Id", "$$searchedUserId"] },
                      { $eq: ["$user1Id", loggedInUserId] },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "followerInfo",
      },
    },
    {
  $unwind: {
    path: "$followerInfo",
    preserveNullAndEmptyArrays: true
  }
},
    {
        $lookup: {
          from: 'followrequests',
          let: { targetUserId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$requestedByUserId', loggedInUserId] },
                    { $eq: ['$requestedToUserId', '$$targetUserId'] }
                  ]
                }
              }
            },
            {
                $project:{
                    _id: 1
                }   
            }
          ],
          as: 'requestSentInfo'
        }
      },
        {
  $unwind: {
    path: "$requestSentInfo",
    preserveNullAndEmptyArrays: true
  }
},
      {
        $lookup: {
          from: 'followrequests',
          let: { targetUserId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$requestedByUserId', '$$targetUserId'] },
                    { $eq: ['$requestedToUserId', loggedInUserId] }
                  ]
                }
              }
            },
            {
                $project:{
                    _id: 1
                }   
            }
          ],
          as: 'requestReceivedInfo'
        }
      },
      {
  $unwind: {
    path: "$requestReceivedInfo",
    preserveNullAndEmptyArrays: true
  }
},
    {
      $project: {
        _id: 1,
        userName: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        followersCount: 1,
        createdAt: 1,
        requestReceivedId: {
            $ifNull: ["$requestReceivedInfo._id", null]
        },
        requestSentId: {
            $ifNull: ["$requestSentInfo._id", null]
        },
        followerId: {
            $ifNull: ["$followerInfo._id", null]
        },
      },
    },
  ]);

  console.log("searchedUser", searchedUser)

  return res
    .status(200)
    .json(new ApiResponse(200, "User Fetched Succesfully", ...searchedUser));
});

export {
  registerController,
  loginController,
  refreshAccessToken,
  logOutUser,
  getUserDetailsByUserIdOrUserName,
};

//TODO =>  getUserDetailsByID (include functionalities like isFollowed), getMyDetails, profileUpdateFunctions
