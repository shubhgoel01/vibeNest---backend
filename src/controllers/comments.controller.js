import ApiError from "../utils/apiError.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Comment } from "../models/comments.models.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import { Post } from "../models/posts.models.js";

const addComment = asyncHandler( async (req, res) => {
    const {postId, content} = req.body
    const userId = req.user?._id

    if(!postId)
        throw ApiError(400, "Invalid request", new Error("postId not found"), 'addComment: comments.controller.js')
    if(!userId)
        throw ApiError(401, "Unauthorized request", new Error("userID not found"), 'addComment: comments.controller.js')

    if(!content || content?.trim().length == 0)
        throw ApiError(400, "Comment should contain atleast one character", new Error("Content field is empty"), 'addComment: comments.controller.js')

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [response] = await Comment.create([{
            postId : postId,
            ownerId: userId,
            content: content.trim()
        }],
        {session})

        //NOTE : because we are passing an array to .create() (required for transactions) it will return an array of response,
        //so simply destructure it
        
        const updatedPost = await Post.findByIdAndUpdate( 
            postId,
            {
                $inc: {commentsCount: 1}
            },
            {
                session, 
                new: true
            }
        )

        await session.commitTransaction();
        session.endSession();

        return res
        .status(201)
        .json(ApiResponse(
            201,
            "Comment Successfully created",
            {response, updatedPost}
        ))
    } 
    catch (error) {
        await session.abortTransaction();
        session.endSession();

        throw ApiError(500, "Some internal Error occurred", new Error("Transaction Failed and rolled back"), 'addComment: comments.controller.js')
    }
})

export default addComment