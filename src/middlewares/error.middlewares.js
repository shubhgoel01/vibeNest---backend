import ApiError from "../utils/apiError.utils.js";

export const globalErrorHandler = (err, req, res, next) => {
    console.log("global error",err.message)
    return res.status(err.statusCode || 500).json({
            statusCode: err.statusCode || 500,
            message: err.message || "Some Internal error occurred",
            error: err.error || null,
            placeOfError: err.placeOfError || "errorHandeler : error.middlewares.js",   
        })
}

//Note In teh first if - i am not directly returning thye err, i am creating a new response 