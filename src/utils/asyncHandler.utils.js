const asyncHandler = (func) => (req, res, next) => {
    Promise.resolve(func(req, res)).catch(next)
}

export default asyncHandler