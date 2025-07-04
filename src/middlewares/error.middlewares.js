import ApiError from "../utils/ApiError.utils.js";
export const globalErrorHandler = (err, req, res, next) => {
    if(err instanceof ApiError) 
        return res.status(err.statusCode).json(err);
    else return res.status(500).json({
        statusCode: 500,
        message: "Some Internal error occurred",
        error: err.message || "Internal Server Error",
        placeOferror: "errorHandeler : error.middlewares.js",
    })
}