import express from "express"
import addCommentController from "../controllers/comments.controller.js"
import verifyUser from "../middlewares/auth.middleware.js"

const commentRouter = express.Router()

commentRouter.route("/comment").post(verifyUser, addCommentController)

export {commentRouter}