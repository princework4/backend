require('dotenv').config();
const redis = require('./redis');
const moment = require('moment')




const sendToken = async (user, statusCode, res) => {
    const accessToken = user?.signInAccessToken();
    const refreshToken = user?.refreshAccessToken();


    // Setting up Session in redis
    redis.set(user._id, JSON.stringify(user), 'EX', 604800); //


    // parse environment variables to integrate with fallback values
    const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10);
    const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10);

    const accessTokenOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: accessTokenExpire * 60 * 1000,
        expires: moment().add(accessTokenExpire, 'minutes').toDate()
    };
    
    const refreshTokenOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: refreshTokenExpire * 60 * 1000,
        expires: moment().add(refreshTokenExpire, 'minutes').toDate()
    };
    
    


    res.cookie("access_token", accessToken, accessTokenOptions)
    res.cookie("refresh_token", refreshToken, refreshTokenOptions)

    // Remove password from user object before sending response
    const userResponse = user.toObject(); // Convert Mongoose document to plain JS object
    delete userResponse.password; // Remove the password field

    res.status(statusCode).json({
        success: true,
        accessToken,
        user : userResponse,
    })
}

module.exports = sendToken