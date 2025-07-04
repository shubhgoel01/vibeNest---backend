import { Temp } from "./model.CDC.js"
import asyncHandler from "../src/utils/asyncHandler.utils.js"
import ApiResponse from "../src/utils/ApiResponse.utils.js"

const uploadData = asyncHandler(async (req, res, next) => {
    const {data} = req.body

    const response  = await Temp.create({
        data
    });

    res.status(200).json(new ApiResponse(
        200,
        "Data Pusehd Successfuly",
        response
    ))
})

export default uploadData
