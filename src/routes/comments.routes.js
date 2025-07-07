import express from "express"
import addCommentController from "../controllers/comments.controller.js"
import verifyUser from "../middlewares/auth.middleware.js"
import { getAllCommentsForPost } from "../controllers/comments.controller.js"
import { getMyAllComments } from "../controllers/comments.controller.js"
import { deleteComment } from "../controllers/comments.controller.js"

const commentRouter = express.Router()

commentRouter.route("/comment").post(verifyUser, addCommentController)
commentRouter.route("/getAllCommentsForPost/:postId").get(verifyUser, getAllCommentsForPost)
commentRouter.route("/getMyAllComments").post(verifyUser, getMyAllComments)
commentRouter.route("/deleteComment/:commentId").delete(verifyUser, deleteComment)

export {commentRouter}