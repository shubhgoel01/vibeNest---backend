import asyncHandler from "../utils/asyncHandler.utils.js";
import ApiError from "../utils/ApiError.utils.js";

const syncErrorController = (req, res) => {
    throw new ApiError(400, "Custom Error for testing", "Error handeled successfuly", "syncErrorController: error.controller.js")
}

const asyncErrorContorller = asyncHandler(async (req, res, next) => {
    throw new ApiError(400, "Custom Error for testing", "Error handeled successfuly", "asyncErrorController: error.controller.js")
})

export { syncErrorController,  asyncErrorContorller}