const express = require('express');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const ErrorMiddleWare = require('./middleware/error.js');
const userRouter = require('./routes/user.route.js');
const courseRouter = require('./routes/course.route.js');
const orderRouter  = require('./routes/order.route.js');
const NotificationRouter = require('./routes/notification.route.js');
const AnalyticsRouter = require('./routes/analytics.route.js');
const layoutRouter = require('./routes/layout.route.js');
const app = express();
const rateLimit = require('express-rate-limit');






// Adding Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max : 100,
    message : "Too many requests. Please try again after 15 minutes",
    headers : true
});


app.use(limiter)


// Middleware to parse JSON payloads
app.use(express.json({ limit: '50mb' }));

// Middleware to parse URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(cors({
    origin: process.env.ORIGIN,
}));

app.use('/api/v1', userRouter, courseRouter, orderRouter, NotificationRouter, AnalyticsRouter, layoutRouter );
app.use(ErrorMiddleWare);


app.all('*', (req, res, next) => {
    const err = new Error('Undefined Route');
    err.statusCode = 404;
    next(err);
});



module.exports = app;
