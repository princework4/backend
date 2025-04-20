const CatchAsyncError = require("../middleware/catchAsyncError");
const redis = require("../utils/redis");
const ErrorHandler = require("../utils/errorHandler");
const UserModel = require("../models/user.model");
const CourseModel = require("../models/course.model");
const OrderModel = require("../models/order.model");

const getUserByID = CatchAsyncError(async (id, res) => {
    const userJSON = await UserModel.findById(id)

    if(userJSON){
        res.status(201).json({
            success: true,
            user : userJSON
        })
    }
});



// Get All users for Admin
const getAllUsersService = CatchAsyncError(async (res, next) => {
    try{
        const users = await UserModel.find().sort({createdAt: -1})
        const totalUsers = await UserModel.countDocuments();
        const totalCourse = await CourseModel.countDocuments();
        const totalOrder = await OrderModel.countDocuments();


        res.status(201).json({
            success: true,
            users: users,
            totalUsers: totalUsers,
            totalCourse : totalCourse,
            totalOrder : totalOrder
        })
    }catch(err){
        next(new ErrorHandler(err.message, 500));
    }
})




// Updating Role -- Admin Only
const updateUserRoleService = CatchAsyncError(async (id, role, res, next) => {
    try{
        await UserModel.updateOne(
            {_id: id},
            {$set: {role: role}}
        )
        res.status(201).json({
            success: true,
            message : "Role Updated Successfully"
        })
    } catch (e) {
        next(new ErrorHandler(e.message, 500))
    }
})


module.exports = {getUserByID, getAllUsersService, updateUserRoleService}