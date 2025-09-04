import express from "express"
import verifyUser from "../middlewares/auth.middleware.js"
import { uploadPost } from "../controllers/post.controllers.js"
import { updatePost } from "../controllers/post.controllers.js"
import { deletePost } from "../controllers/post.controllers.js"
import { upload } from "../utils/multer.utils.js"
// import { getAllPosts } from "../controllers/post.controllers.js"
// import { getPostsByUserNameOrUserID } from "../controllers/post.controllers.js"
// import { getPostByID } from "../controllers/post.controllers.js"
import { getPosts_Merged } from "../controllers/post.controllers.js"

const postRouter = express.Router()

postRouter.route("/post").post(
  verifyUser,
  upload.array("media", 5),
  uploadPost
);

postRouter.route("/:postId")
  .patch(verifyUser, updatePost)
  .delete(verifyUser, deletePost);

postRouter.route("/").get(verifyUser, getPosts_Merged);

export {postRouter}