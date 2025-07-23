import express from "express"
import verifyUser from "../middlewares/auth.middleware.js"
import { getAllTrending, addImpression, deleteTrending, findTrendingByTag, createnewTrending } from "../controllers/trending.controller.js"

const trendingRouter = express.Router()

trendingRouter.route("").get(getAllTrending)
trendingRouter.route("").post(verifyUser, createnewTrending)
trendingRouter.route("/impression/:_id").post(addImpression)
trendingRouter.route("/:_id").delete(verifyUser, deleteTrending)
trendingRouter.route("/:tag").get(findTrendingByTag)

export {trendingRouter}