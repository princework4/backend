const CatchAsyncError = require("../middleware/catchAsyncError");
const CourseModel = require("../models/course.model");
const UserModel = require("../models/user.model");
const ErrorHandler = require("../utils/errorHandler");


// Create Course 
const createCourse = CatchAsyncError(async (data, res) => {
    const course = await CourseModel.create(data);
    res.status(201).json({ message: "Course created successfully", course });
})


const getAllCoursesService = CatchAsyncError(async (res, next) => {
    try{
        const courses = await CourseModel.find()
        res.status(201).json({
            success: true,
            courses: courses
        })
    }catch(err){
        next(new ErrorHandler(err.message, 500));
    }
})
module.exports = {createCourse, getAllCoursesService}