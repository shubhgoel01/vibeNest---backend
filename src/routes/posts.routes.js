import express from "express"
import verifyUser from "../middlewares/auth.middleware.js"
import { uploadPost } from "../controllers/post.controllers.js"
import { editPost } from "../controllers/post.controllers.js"
import { deletePost } from "../controllers/post.controllers.js"
import { upload } from "../utils/multer.utils.js"

const postRouter = express.Router()

postRouter.route("/uploadPost").post(
    verifyUser,
    upload.fields([
        {
            name: 'videos',
            maxCount: 5
        },
        {
            name: 'images',
            maxCount: 5
        }
    ]),
    uploadPost
)
postRouter.route("/editPost").post(verifyUser, editPost)
postRouter.route("/deletePost").post(verifyUser, deletePost)

export {postRouter}