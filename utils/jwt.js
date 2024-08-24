require('dotenv').config();
const redis = require('./redis');
const moment = require('moment')




const sendToken = async(user, statusCode, res) => {
    const accessToken = user?.signInAccessToken();
    const refreshToken = user?.refreshAccessToken();


    // Setting up Session in redis
    redis.set(user._id, JSON.stringify(user), 'EX', 604800); //


    // parse environment variables to integrate with fallback values
    const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10);
    const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10);

    // Options for cookies
    const accessTokenOptions = {
        httpOnly: false,
        maxAge: accessTokenExpire * 60 * 1000,
        secure: process.env.NODE_ENV == "Production",
        sameSite: 'Lax',
        expires: moment().add(accessTokenExpire, 'minutes').format()
    };

    const refreshTokenOptions = {
        httpOnly: false,
        maxAge: refreshTokenExpire * 24 * 60 * 1000,
        secure: process.env.NODE_ENV == "Production",
        sameSite: 'Lax',    
        expires: moment().add(refreshTokenExpire, 'minutes').format()
    };


    res.cookie("access_token", accessToken, accessTokenOptions)
    res.cookie("refresh_token", refreshToken, refreshTokenOptions)


    res.status(statusCode).json({
        success: true,
        accessToken,
        user,
    })
}

module.exports = sendToken