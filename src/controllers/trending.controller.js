import { Trending } from "../models/trending.models.js";
import ApiError from "../utils/apiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import mongoose from "mongoose";

const getAllTrending = async (req, res) => {
    console.log("getAllTrending called")
    const trending = await Trending.find().sort({impressions: -1})
    return res.status(200).json(new ApiResponse(200, "All Trends", trending));
}

const addImpression = async (req, res) => {
    const _id = req?.params?._id
    if(!_id)
        throw new ApiError(404, "Please Pass the id", {})

    let response = await Trending.findById(new mongoose.Types.ObjectId(_id))
    response.impressions += 1

    response = await response.save()    
    console.log(response)

    if(!response)
        throw new ApiError(404, "Your Request Cannot Be completed", {})

    return res.status(200).json(new ApiResponse(200, "Impression Added", response))
}

const deleteTrending = async (req, res) => {
    
    const _id = req.params?._id
    console.log(_id)
    if(!_id)
        throw new ApiError(404, "No impression found to delete", {})

    //Here perform a check that the currentLoginUser and owner are same

    let response = await Trending.findByIdAndDelete(new mongoose.Types.ObjectId(_id))
    if(!response)
        throw new ApiError(400, "No impression found to delete", {})

    return res.status(200).json(new ApiResponse(200, "Impression Deleted", {}))
}

const findTrendingByTag = async (req, res) => {
    console.log("findTrendingByTag function called`")
    const tag = "#" + req?.params.tag
    if(!tag)
        throw new ApiError(400, "No Trending found", {})

    let response = await Trending.find({tag: tag})
    if(!response || response.length === 0)
        throw new ApiError(404, "no trend found")

    console.log(response)

    return res.status(200).json(new ApiResponse(200, "trend found", response))
}

const createnewTrending = async (req, res) => {
    const tag = "#" + req.body?.tag
    const loggedInUserId = req.user?._id
    if(!tag)
        throw new ApiError(404, "No Trending found", {})

    let response = await Trending.create({
        tag: tag,
        ownerId: loggedInUserId
    })

    console.log(response)

    if(!response)
        throw new ApiError(404, "unaable to create", {})

    return res.status(200).json(new ApiResponse(200, "Trend Created", response))
}

export {getAllTrending, addImpression, deleteTrending, findTrendingByTag, createnewTrending}

//I am adding '#' on server side, beacuse passing "#elonMusk" was causing problem in portman in route