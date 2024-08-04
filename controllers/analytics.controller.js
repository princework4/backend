const CatchAsyncError = require("../middleware/catchAsyncError");
const CourseModel = require("../models/course.model");
const OrderModel = require("../models/order.model");
const userModel = require("../models/user.model");
const generateLast12MonthsData = require("../utils/analytics.generator");
const ErrorHandler = require("../utils/errorHandler");


// Get User Analytics
const getUserAnalytics = CatchAsyncError(async (req, res, next) => {
    try {
        const users = await generateLast12MonthsData(userModel)
        res.status(201).json({ 
            success: true, 
            data: users 
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500))
    }
});


// Get Course Analytics
const getCourseAnalytics = CatchAsyncError(async (req, res, next) => {
    try {
        const course = await generateLast12MonthsData(CourseModel)
        res.status(201).json({ 
            success: true, 
            data: course 
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500))
    }
});



// Get Orders Analytics
const getOrderAnalytics = CatchAsyncError(async (req, res, next) => {
    try {
        const orders = await generateLast12MonthsData(OrderModel)
        res.status(201).json({ 
            success: true, 
            data: orders 
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500))
    }
});






module.exports = {getUserAnalytics, getCourseAnalytics, getOrderAnalytics}