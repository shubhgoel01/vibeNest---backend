import express from "express";
import { createFollowRequest } from "../controllers/follow.controller.js";
import { acceptFollowRequest } from "../controllers/follow.controller.js";
import { rejectFollowRequest } from "../controllers/follow.controller.js";
import { removeFollower } from "../controllers/follow.controller.js";
import { getAllFollowersForUser } from "../controllers/follow.controller.js";
import { getAllFollowersCount } from "../controllers/follow.controller.js";
import { getAllFollowRequestsSent } from "../controllers/follow.controller.js";
import { allFollowRequestsReceived } from "../controllers/follow.controller.js";
import verifyUser from "../middlewares/auth.middleware.js"

const followRouter = express.Router()

followRouter.route("/users/follow-requests").post(verifyUser, createFollowRequest);
followRouter.route("/follow-requests/accept/:requestId").patch(verifyUser, acceptFollowRequest);
followRouter.route("/follow-requests/reject/:requestId").patch(verifyUser, rejectFollowRequest);
followRouter.route("/followers").delete(verifyUser, removeFollower);
followRouter.route("/users/followers").get(verifyUser, getAllFollowersForUser);
followRouter.route("/users/followers/count").get(verifyUser, getAllFollowersCount);
followRouter.route("/follow-requests/sent").get(verifyUser, getAllFollowRequestsSent);
followRouter.route("/follow-requests/received").get(verifyUser, allFollowRequestsReceived);

export default followRouter
