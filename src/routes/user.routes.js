import express from "express"
import { registerController } from "../controllers/users.controllers.js";
import { loginController } from "../controllers/users.controllers.js";
import { refreshAccessToken } from "../controllers/users.controllers.js";
import { logOutUser } from "../controllers/users.controllers.js";
import verifyUser from "../middlewares/auth.middleware.js";
import { upload } from "../utils/multer.utils.js";
import { getUserDetailsByUserIdOrUserName } from "../controllers/users.controllers.js";
import { getAllLikedPostsForUser } from "../controllers/likes.controller.js";

const userRouter = express.Router();
const authRouter = express.Router()

authRouter.route("/register").post(
    upload.single('avatar'),
    registerController
)
authRouter.route("/login").post(loginController)
authRouter.route("/refresh").post(refreshAccessToken)
userRouter.route("/logout").post(verifyUser, logOutUser)

userRouter.route("/:userIdOrName").get(verifyUser, getUserDetailsByUserIdOrUserName)

export {userRouter, authRouter}

/*
    NOTE : Refresh token route shouldn’t require verifyUser
    This is because, verifyUser verifies weather the incoming requests are comming from a legit (login) user or not, hence uses the 
    accessToken to verify.
    When the access token expires, the client won’t be able to call routes that require authentication.
*/