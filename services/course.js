const CatchAsyncError = require("../middleware/catchAsyncError");
const CourseModel = require("../models/course.model");
const NotificationModel = require("../models/notification.model");
const UserModel = require("../models/user.model");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendMail");





const getAllCoursesService = CatchAsyncError(async (req, res, next) => {
    try {
        const user = req.user
        const isAdmin = user.role.some((item) => item === 'admin')
        if (isAdmin) {
            const courses = await CourseModel.find()
            res.status(201).json({
                success: true,
                courses: courses
            })
        } else {
            const courses = await CourseModel.find({ createdBy: user })
            res.status(201).json({
                success: true,
                courses: courses
            })
        }
    } catch (err) {
        next(new ErrorHandler(err.message, 500));
    }
})
module.exports = { getAllCoursesService }