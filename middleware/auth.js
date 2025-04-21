const jwt = require('jsonwebtoken'); // Ensure jwt is required if using JWT tokens
const Redis = require('ioredis');
const CatchAsyncError = require('./catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
require('dotenv').config();

const redisClient = new Redis(process.env.REDIS_URL);



// Middleware to authenticate user
const authenticateUser = CatchAsyncError(async (req, res, next) => {
    const token = req.cookies['access_token'];
    if (!token) {
        return next(new ErrorHandler('Please signup or login', 401));
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await redisClient.get(decoded.id);
        if (!user) {
            return next(new ErrorHandler('Please login again', 401));
        }
        req.user = JSON.parse(user);
        next();
    } catch (error) {
        return next(new ErrorHandler('Please signup or login ' + error, 401));
    }
});




// Validate User Roles
const authorizeRoles = (...allowedRoles) => {
    return CatchAsyncError(async (req, res, next) => {
      if (!req.user || !req.user.role || !Array.isArray(req.user.role)) {
        return next(new ErrorHandler('Invalid user roles format', 403));
      }  
      const hasRole = req.user.role.some(role => allowedRoles.includes(role));
      if (!hasRole) {
        return next(new ErrorHandler('You do not have permission to perform this action', 403));
      }
      next();
    });
  };




// validateRefreshToken
const validateRefreshToken = CatchAsyncError(async(req, res, next) => {
    const refreshToken = req.cookies['refresh_token'];
    if(!refreshToken){
        return next(new ErrorHandler('Refresh token not found', 400))
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        if(!decoded){
            return next(new ErrorHandler('Invalid refresh token', 401))
        }
        const user = await redisClient.get(decoded.id);
        if(!user){
            return next(new ErrorHandler('User not found', 404))
        }
        req.user = JSON.parse(user);
        next()
    } catch (error) {
        next(new ErrorHandler('Please signup or login ' + error, 401))
    }
})


module.exports = {authenticateUser, authorizeRoles, validateRefreshToken};
