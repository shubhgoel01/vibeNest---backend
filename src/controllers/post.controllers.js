import {MAX_FILES_COUNT} from "../constants.js"

import asyncHandler from '../utils/asyncHandler.utils.js'
import ApiError from '../utils/apiError.utils.js'
import { Post } from '../models/posts.models.js';
import ApiResponse from '../utils/ApiResponse.utils.js';
import {uploadOnCloudinary} from '../utils/cloudinary.utils.js';
import mongoose from "mongoose"
import { deleteFromCloudinary } from "../utils/cloudinary.utils.js";
import { Like } from "../models/likes.models.js";
import { User } from "../models/users.models.js";
import { Comment } from "../models/comments.models.js";

const uploadPost = asyncHandler(async (req, res) => {
    const { title, description, status = 'public'} = req.body;
    const userId = req.user?._id;
    const array_files = [];

    if (!userId) {
        throw new ApiError(401, 'Unauthorized', new Error('User not authenticated'), 'uploadVideo: videos.controllers.js');
    }

    if (!title || !description) {
        throw new ApiError(400, 'Title and description are required', new Error("Title and description are required"), 'uploadVideo: videos.controllers.js');
    }

    const totalFiles =
        (req.files?.videos?.length || 0) +
        (req.files?.images?.length || 0);

    if (totalFiles > MAX_FILES_COUNT) {
        throw new ApiError(400, `Total Files cannot exceed ${MAX_FILES_COUNT}`, new Error(`File count exceeds ${MAX_FILES_COUNT}`), 'uploadVideo: videos.controllers.js');
    }

    if (req.files?.videos?.length > 0) {
        for (const file of req.files.videos) {
            console.log("Uplaoding videos on cloudinary")
            const uploadedVideo = await uploadOnCloudinary(file.path);
            
            array_files.push({
                url: uploadedVideo?.secure_url,
                public_id: uploadedVideo?.public_id
            });
        }
    }

    if (req.files?.images?.length > 0) {
        for (const file of req.files.images) {
            console.log("Uplaoding Images on cloudinary")
            const uploadedImage = await uploadOnCloudinary(file.path);
            console.log(uploadedImage)
            
            array_files.push({
                url: uploadedImage?.secure_url,
                public_id: uploadedImage?.public_id}
            );
        }
    }

    const newPost = new Post({
        title,
        description,
        fileUrl: array_files,
        ownerId: userId,
        status: status
    });

    const savedPost = (await newPost.save()).toObject();
    delete savedPost.updatedAt
    delete savedPost.__v

    return res
        .status(201)
        .json(new ApiResponse(201, "Post posted successfully", savedPost));
});

const updatePost = asyncHandler(async (req, res) => {
    const { title, description, postId, status } = req.body;
    const userId = req.user?._id;
    console.log(userId)

    if (!userId)
        throw new ApiError(401, "You are unauthorized to perform the action", new Error("userID not found"), "editPost: videos.controller.js");

    if (!postId)
        throw new ApiError(400, "postId required", new Error("Could not find post id"), "editPost: videos.controller.js");

    // Only include fields provided in the request body
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (status) updateFields.status = status;

    const updatedPost = await Post.findOneAndUpdate(
        { _id: postId, ownerId: userId },
        updateFields,
        { new: true }
    ).select("-__v -updatedAt").lean();

    if (!updatedPost)
        throw new ApiError(404, "No post found or you are not authorized", new Error("Either post does not exist or user is not the owner"), "editPost: videos.controller.js");
  
    const ownerDetails = await User.findById(new mongoose.Types.ObjectId(updatedPost.ownerId)).select("-email -password -refreshToken -__v -createdAt -updatedAt -followersCount -fullName").lean()
    updatedPost.ownerDetails = ownerDetails
    console.log(updatedPost)
    console.log(ownerDetails)

    return res.status(200).json(
        new ApiResponse(200, "Post Successfully Updated", updatedPost)
    );
});

/*
    Things to note:  
    In above updated code now allow users to update only selected fields, along with that verifying that
    user is only able to update his own post. (with optimization)
*/

const deletePost = asyncHandler(async (req, res) => {
    const {postId} = req.body
    const userId = req.user?._id

    if(!postId)
        throw new ApiError(400, "postId required", new Error("Could not find post id"), "deletePost: videos.controller.js")

    if(!userId)
        throw new ApiError(401, "You are unauthorized to perform the action", new Error("userID not found"), "deletePost: videos.controller.js")

    const deletedPost = await Post.findOneAndDelete({ 
        _id: new mongoose.Types.ObjectId(postId),
        ownerId: new mongoose.Types.ObjectId(userId)
     });
    if (!deletedPost) 
        throw new ApiError(404, "Post not found or already deleted");

    await Comment.deleteMany({postId: postId})
    await Like.deleteMany({postId: postId})

    for (const {url, public_id} of deletedPost.fileUrl) {
        const resource_type = url.includes("image")? "image" : "video"
        await deleteFromCloudinary(public_id, resource_type);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "PostDeleted Successfully", {isDeleted: true}))
})

/*
    IMP : Note that we are first deleting the post and then deleting the posts, because there may be a case if we delete files
    from the cloudinary first, and may be due to some error (network error) databse operation fails, then the post contains invalid 
    files links, this is harmful but reverse is not.
    ALTERNATIVE: we can use transactions

    NOTE: Note how we are performing validation when deletign a post, we are finding a post that matched both
        1. postId 
        2. userId
    So, if some user tries to delete a post that he has not created, he will get error post not found.
    For this particulat validation, we have one more approach

    Also its crucial to delete all the likes and comments related to that post
*/

const getPostsByUserNameOrUserID = asyncHandler(async(req, res) => {
    const userName_Id = req.params?.userName_Id
    let query = undefined, query2 = undefined

    const {pageLimit, lastPostId, lastCreatedAt} = req.query
    console.log(pageLimit)
    console.log(lastPostId)
    console.log(lastCreatedAt)

    
    if(mongoose.Types.ObjectId.isValid(userName_Id))
        query = {_id: new mongoose.Types.ObjectId(userName_Id)}
    else query = {userName: userName_Id}

    const user = await User.findOne(query)  
    const myPosts = (req.user?._id === user._id)? "private" : "public"

    query2 = (!lastPostId) ? 
                {
                ownerId: user._id, 
                status: {
                    $in: ["public", myPosts]
                    }
                }:
                {
                    ownerId: user._id, 
                    status: {
                        $in: ["public", myPosts]
                    },
                    $or: [
                        { createdAt: { $lt: new Date(lastCreatedAt) } },
                        { createdAt: new Date(lastCreatedAt), _id: { $lt: lastPostId } }
                    ]
                }
    console.log(query2)
    
    const result = await Post.aggregate([
        {
            $match: query2
        },
        {
            $sort: {createdAt: -1, _id: -1}
        },
        {
            $limit: Number(pageLimit)
        },
        // {
        //     $lookup: {
        //         from: "likes",
        //         localField: "_id",
        //         foreignField: "postId",
        //         as: "like",
        //         pipeline: [
        //             {
        //                 $match: {ownerId: new mongoose.Types.ObjectId(req.user?._id)}
        //             },
        //             {
        //                 $project: {
        //                     _id: 1
        //                 }
        //             }
        //         ]
        //     }
        // },
        // {
        //     $lookup: {
        //         from: "users",
        //         localField: "ownerId",
        //         foreignField: "_id",
        //         as: "ownerDetails",
        //         pipeline: [
        //             {
        //                 $project: {
        //                     _id: 1,
        //                     userName: 1,
        //                     avatar: 1
        //                 }
        //             }
        //         ]
        //     }
        // },
        // {
        //     $unwind: "$ownerDetails"    // NOTE: by defualt, lookup returns an array, but i am sure there is only one element and 
        //     //in my result i awnt to store the object directly, so flattenned the ownerDetails
        // },
        // {
        //     $addFields: {
        //         isLiked: {
        //             $cond: {
        //                 if: {$size: "$like"},
        //                 then: true,
        //                 else: false
        //             }
        //         }
        //     }
        // },
        // {
        //     $project: {
        //         "_id" : 1,
        //         "title": 1,
        //         "description": 1,
        //         "fileUrl": 1,
        //         "ownerId": 1,
        //         "views": 1,
        //         "likesCount": 1,
        //         "commentsCount": 1,
        //         "createdAt": 1,
        //         "isLiked": 1,
        //         "ownerDetails": 1
        //     }
        // }    
    ])
    console.log(result)

    const resultLength = result.length
    const metaData = {
        pageLimit: pageLimit,
        lastPostId: (resultLength<pageLimit)? null : result[resultLength-1]._id,
        lastCreatedAt:  (resultLength<pageLimit)? null : result[resultLength-1].createdAt,
    }

    return res  
    .status(200)
    .json(new ApiResponse(
        200
        ,`Posts fetched for user ${user.userName || userName_Id}`
        ,{result, metaData}))
})

const getAllPosts = asyncHandler(async (req, res) => {

    const {pageLimit, lastCreatedAt, lastPostId} = req.query


    const query = (!lastCreatedAt)? {} : {
        $or: [
            { createdAt: { $lt: new Date(lastCreatedAt) } },
            { createdAt: new Date(lastCreatedAt), _id: { $lt: lastPostId } }
        ]
    }

    const result = await Post.aggregate([
        { 
            $match: query
        },
        {
            $sort: {createdAt: -1, _id: -1}
        },
        {
            $limit: Number(pageLimit)
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
        }
    ])
    const resultLength = result.length
    const metaData = {
        pageLimit: pageLimit,
        lastCreatedAt: resultLength<pageLimit? null : result[result.length-1].createdAt,
        lastPostId: resultLength<pageLimit? null : result[result.length-1]._id
    }

    return res.status(200).json(new ApiResponse(
        200,
        "Next Page fetched Successfully",
        {result, metaData}
    ))
})

const getPostByID = asyncHandler(async (req, res) => {
    const {postId} = req.params

    const result = await Post.aggregate([
        {
            $match: {_id: new mongoose.Types.ObjectId(postId)}
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
        }
    ])

    return res.status(200).json(new ApiResponse(
        200,
        "Post fetched successfully",
        result
    ))
})


export {
    uploadPost,
    updatePost,
    deletePost,
    getPostsByUserNameOrUserID,
    getAllPosts,
    getPostByID
}

//TODO: getAllPosts, getPostsByUserName, (include functionalities like, is post liked? by the user also handle when user is loogedIn and not loggedIn), changeStatusOfPost(unPublished, private, public)

//NEED TO UPDATE getPostsByUserName, there are many inconsistencies that can ause problems in frontEnd, also include some userDetails