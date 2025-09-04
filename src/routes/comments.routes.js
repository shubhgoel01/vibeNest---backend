import express from "express"
import {addCommentController} from "../controllers/comments.controller.js"
import verifyUser from "../middlewares/auth.middleware.js"
import { getAllCommentsForPost } from "../controllers/comments.controller.js"
import { getMyAllComments } from "../controllers/comments.controller.js"
import { deleteComment } from "../controllers/comments.controller.js"

const commentRouter = express.Router()

commentRouter.route("/post/:postId/comment").post(verifyUser, addCommentController)
commentRouter.route("/post/:postId/comments").get(getAllCommentsForPost)
commentRouter.route("/user/:userId/comments").get(verifyUser, getMyAllComments)
commentRouter.route("/post/:postId/comment/:commentId").delete(verifyUser, deleteComment)

export {commentRouter}