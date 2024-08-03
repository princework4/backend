const ErrorHandler = require('../utils/errorHandler');



const ErrorMiddleWare = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.message = err.message || "Internal Server Error"


    // For wrong Mongo DB ID
    if (err.name == "CastError") {
        const msg = `Resource not found ${err.path}`
        err = new ErrorHandler(msg, 400);
    }


    // For Duplicate key Error
    if (err.code == 11000) {
        const msg = `Duplicate key ${Object.keys(err.keyValue)} entered`
        err = new ErrorHandler(msg, 400)
    }


    // Wrong JWT Error
    if (err.name == "JsonWebTokenError") {
        const msg = "Invalid token"
        err = new ErrorHandler(msg, 400);
    }


    // JWT Expire Error 
    if (err.name == "TokenExpiredError") {
        const msg = "Token Expired"
        err = new ErrorHandler(msg, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}

module.exports = ErrorMiddleWare
