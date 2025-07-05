import asyncHandler from "../utils/asyncHandler.utils.js"
import ApiError from "../utils/apiError.utils.js"
import jwt from "jsonwebtoken"
import { User } from "../models/users.models.js"

const verifyUser = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if(!accessToken)
        throw new ApiError(401, "Unauthorized Access", "accessToken not found", "verifyUser: auth.middleWare.js")

    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
    
    if(!decodedToken)
        throw new ApiError(401, "Unauthorized Access", "accessToken has expired", "verifyUser: auth.middleWare.js")

    const user = await User.findById(decodedToken?._id).select("-password -refreshtoken")

    req.user = user
    next()
})

export default verifyUser