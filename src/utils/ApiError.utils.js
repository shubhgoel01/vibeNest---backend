class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong", 
        error,
        placeOfError = "Unknown"
    ) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.error = error
        this.placeOfError = placeOfError;
        this.success = false;
    }
}

export default ApiError