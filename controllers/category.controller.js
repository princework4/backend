const CatchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const CourseModel = require("../models/course.model");
const redis = require("../utils/redis.js");
const categoryModal = require("../models/category.model.js");

const addCategoryMaster = CatchAsyncError(async (req, res, next) => {
  try {
    const data = req.body;
    if (!req.user || !req.user._id) {
      return next(new ErrorHandler("User not authenticated", 401));
    }
    if (!data || !data.title) {
      return next(new ErrorHandler("Missing Category", 400));
    }

    const category = await categoryModal.create(data);

    res.status(201).json({
      success: true,
      message: `Category created successfully`,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

const getCategoryMaster = CatchAsyncError(async (req, res, next) => {
  try {
    const category = await categoryModal.find().select('title');
    res.status(201).json({
      success: true,
      data: category,
      message: `Success`,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

module.exports = {
  addCategoryMaster,
  getCategoryMaster,
};
