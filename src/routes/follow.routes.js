import express from "express";
import { createFollowRequest } from "../controllers/follow.controller.js";
import { acceptFollowRequest } from "../controllers/follow.controller.js";
import { rejectFollowRequest } from "../controllers/follow.controller.js";
import { removeFollower } from "../controllers/follow.controller.js";
import { getAllFollowersForUser } from "../controllers/follow.controller.js";
import { getAllFollowersCount } from "../controllers/follow.controller.js";
import { getAllFollowRequestsSent } from "../controllers/follow.controller.js";
import { allFollowRequestsReceived } from "../controllers/follow.controller.js";
import { cancelFollowRequest } from "../controllers/follow.controller.js";
import verifyUser from "../middlewares/auth.middleware.js"

const followRouter = express.Router()

followRouter.route("/:userId/followRequest").post(verifyUser, createFollowRequest);
followRouter.route("/:userId/follow-request/:requestId/accept").post(verifyUser, acceptFollowRequest);
followRouter.route("/:userId/follow-request/:requestId/reject").delete(verifyUser, rejectFollowRequest);
followRouter.route("/:userId/follow/:followId").delete(verifyUser, removeFollower);
followRouter.route("/:userId/followers").get(verifyUser, getAllFollowersForUser);
followRouter.route("/:userId/followers/count").get(verifyUser, getAllFollowersCount);
followRouter.route("/:userId/follow-requests/sent").get(verifyUser, getAllFollowRequestsSent);
followRouter.route("/:userId/follow-requests/received").get(verifyUser, allFollowRequestsReceived);
followRouter.route("/:userId/follow-requests/:requestId").delete(verifyUser, cancelFollowRequest);

export default followRouter
