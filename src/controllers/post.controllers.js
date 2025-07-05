import MAX_FILES_COUNT from '../constants.js'

import asyncHandler from '../utils/asyncHandler.utils.js'
import ApiError from '../utils/apiError.utils.js'
import { Post } from '../models/posts.models.js';
import ApiResponse from '../utils/ApiResponse.utils.js';
import uploadOnCloudinary from '../utils/cloudinary.utils.js';

const uploadPost = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
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
            const uploadedVideo = await uploadOnCloudinary(file.path);
            
            array_files.push(uploadedVideo.secure_url);
        }
    }

    if (req.files?.images?.length > 0) {
        for (const file of req.files.images) {
            const uploadedImage = await uploadOnCloudinary(file.path, "image");
            if (!uploadedImage?.secure_url) {
                throw new ApiError(500, "Image upload failed", new Error("Cloudinary upload failed"), 'uploadVideo: videos.controllers.js');
            }
            array_files.push(uploadedImage.secure_url);
        }
    }

    const newPost = new Post({
        title,
        description,
        fileUrl: array_files,
        ownersId: userId,
    });

    const savedPost = await newPost.save();

    return res
        .status(201)
        .json(new ApiResponse(201, "Post posted successfully", savedPost));
});

const editPost = asyncHandler(async (req, res) => {
    const {title, description, postId} = req.body
    const userId = req.user?._id

    if(!userId)
        throw ApiError(401, "You are unauthorized to perform the action", new Error("userID not found"), "editPost: videos.controller.js")
    if(!postId)
        throw ApiError(400, "postId required", new Error("Could not find post id"), "editPost: videos.controller.js")


    const existingPost = await Post.findById(postId);
    if(!existingPost)
        throw ApiError(400, "No post found", new Error("Post with passed id does not exist"), "editPost: videos.controller.js")

    const updatedPost = Post.findbyIdAndUpdate(postId, {
            title: title || existingPost.title,
            description: description || existingPost.description,
        },
    { new: true })

    if(!updatedPost)
        throw ApiError(500, "Some internal Error Occurred", new Error("Failed to update post"), "editPost: videos.controller.js")

    return res
        .status(200)
        .ApiResponse(200, "Poast Successfuly Updated", updatedPost)
})

const deletePost = asyncHandler(async (req, res) => {
    const {postId} = req.body
    const userId = req.user?._id

    if(!postId)
        throw ApiError(400, "postId required", new Error("Could not find post id"), "deletePost: videos.controller.js")

    if(!userId)
        throw ApiError(401, "You are unauthorized to perform the action", new Error("userID not found"), "deletePost: videos.controller.js")

    const deletedPost = await Post.findOneAndDelete({ _id: postId, user: userId });
    if (!deletedPost) 
        throw ApiError(404, "Post not found or already deleted");

    for (const url of deletedPost.fileUrl) {
        await deleteFromCloudinary(url);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "PostDeleted Successfully", {}))
})

/*
    IMP : Note that we are first deleting the post and then deleting the posts, because there may be a case if we delete files
    from the cloudinary first, and may be due to some error (network error) databse operation fails, then the post contains invalid 
    files links, this is harmful and reverse is not.
    ALTERNATIVE: we can use transactions
*/

export {
    uploadPost,
    editPost,
    deletePost
}

//TODO: getAllPosts, getmyPosts, getPostsByID, (include functionalities like, is post liked?, ), changeStatusOfPost(unPublished, private, public)