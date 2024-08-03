const CatchAsyncError = require("../middleware/catchAsyncError");
const CourseModel = require("../models/course.model");


// Create Course 
const createCourse = CatchAsyncError(async (data, res) => {
    const course = await CourseModel.create(data);
    res.status(201).json({ message: "Course created successfully", course });
})

module.exports = createCourse