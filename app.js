const express = require('express');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const ErrorMiddleWare = require('./middleware/error.js');
const userRouter = require('./routes/user.route.js');
const courseRouter = require('./routes/course.route.js');

const app = express();

// Middleware to parse JSON payloads
app.use(express.json({ limit: '50mb' }));

// Middleware to parse URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(cors({
    origin: process.env.ORIGIN,
}));

app.use('/api/v1', userRouter);
app.use('/api/v1/', courseRouter)
app.use(ErrorMiddleWare);


app.all('*', (req, res, next) => {
    const err = new Error('Undefined Route');
    err.statusCode = 404;
    next(err);
});



module.exports = app;
