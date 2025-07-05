import express from "express"
import verifyUser from "../middlewares/auth.middleware.js"
import { uploadPost } from "../controllers/post.controllers.js"
import { editPost } from "../controllers/post.controllers.js"
import { deletePost } from "../controllers/post.controllers.js"

const postRouter = express.Router()

postRouter.route("/uploadPost").post(verifyUser, uploadPost)
postRouter.route("/updatePost").post(verifyUser, editPost)
postRouter.route("/deletePost").post(verifyUser, deletePost)

export {postRouter}