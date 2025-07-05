import ApiError from "../utils/apiError.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Comment } from "../models/comments.models.js";
import ApiResponse from "../utils/ApiResponse.utils.js";

const addComment = asyncHandler( async (req, res) => {
    const {postId, content} = req.body
    const userId = req.user?._id

    if(!postId || content)
        throw ApiError(400, "Invalid request", new Error("postId not found"), 'addComment: comments.controller.js')
    if(!userId)
        throw ApiError(401, "Unauthorized request", new Error("userID not found"), 'addComment: comments.controller.js')

    if(!content || content?.trim.length == 0)
        throw ApiError(400, "Comment should contain atleast one character", new Error("Content field is empty"), 'addComment: comments.controller.js')

    const session = await mongoose.startSession();
    await session.with 
    const response = Comment.create({
        postId : postId,
        ownerId: userId,
        content: content
    })

    if(!response)
        throw ApiError(500, "Some internal Error occurred", new Error("failed to create a comment"), 'addComment: comments.controller.js')

    return res
        .status(201)
        .json(ApiResponse(
            201,
            "Comment Successfully created",
            response
        ))
})