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
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json');
const CategoryRouter = require('./routes/category.route.js');



app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        if (process.env.ORIGIN.includes(origin)) {
            return callback(null, true);
        } else {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));

// Adding Rate Limiter
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max : 200,
    message : "Too many requests. Please try again after 15 minutes",
    headers : true
});


app.use(limiter)


// Middleware to parse JSON payloads
app.use(express.json({ limit: '50mb' }));

// Middleware to parse URL-encoded payloads
app.use(express.urlencoded({ extended: true, limit : '10mb' }));

app.use(cookieParser());

app.use('/api/v1', userRouter, courseRouter, orderRouter, NotificationRouter, AnalyticsRouter, layoutRouter, CategoryRouter );
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))
app.use(ErrorMiddleWare);


app.all('*', (req, res, next) => {
    const err = new Error('Undefined Route');
    err.statusCode = 404;
    next(err);
});



module.exports = app;
