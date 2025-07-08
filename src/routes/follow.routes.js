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

followRouter.route("/followRequest").post(verifyUser, createFollowRequest);
followRouter.route("/follow-request/:requestId/accept").post(verifyUser, acceptFollowRequest);
followRouter.route("/follow-request/:requestId/reject").post(verifyUser, rejectFollowRequest);
followRouter.route("/follow/:id").delete(verifyUser, removeFollower);
followRouter.route("/followers").get(verifyUser, getAllFollowersForUser);
followRouter.route("/followers/count").get(verifyUser, getAllFollowersCount);
followRouter.route("/follow-requests/sent").get(verifyUser, getAllFollowRequestsSent);
followRouter.route("/follow-requests/received").get(verifyUser, allFollowRequestsReceived);
followRouter.route("/follow-requests/:requestId").delete(verifyUser, cancelFollowRequest);

export default followRouter
