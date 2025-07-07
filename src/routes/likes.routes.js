import express from "express"
import { toggleLikeController } from "../controllers/likes.controller.js"
import verifyUser from "../middlewares/auth.middleware.js"

const likeRouter = express.Router()

likeRouter.route("/toggleLike").post(verifyUser, toggleLikeController)

export {likeRouter}