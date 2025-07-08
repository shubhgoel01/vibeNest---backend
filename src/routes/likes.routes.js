import express from "express"
import { toggleLikeController } from "../controllers/likes.controller.js"
import verifyUser from "../middlewares/auth.middleware.js"
import { getAllLikedPostsForUser } from "../controllers/likes.controller.js"

const likesRouter = express.Router()


likesRouter.route("/post/:postId/like").post(verifyUser, toggleLikeController)
likesRouter.route("user/:userIdorName/likes").get(verifyUser, getAllLikedPostsForUser)


export {likesRouter}