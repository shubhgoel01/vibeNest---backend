import express from "express"
import { likeController } from "../controllers/likes.controller.js"
import { unlikeController } from "../controllers/likes.controller.js"
import verifyUser from "../middlewares/auth.middleware.js"

const likeRouter = express.Router()

likeRouter.route("/like").post(verifyUser, likeController)
likeRouter.route("/unlike").post(verifyUser, unlikeController)

export {likeRouter}