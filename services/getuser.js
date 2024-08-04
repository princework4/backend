const CatchAsyncError = require("../middleware/catchAsyncError");
const redis = require("../utils/redis");
const ErrorHandler = require("../utils/errorHandler");
const UserModel = require("../models/user.model");

const getUserByID = CatchAsyncError(async (id, res) => {
    const userJSON = await redis.get(id)

    if(userJSON){
        const user = JSON.parse(userJSON)
        res.status(201).json({
            success: true,
            user
        })
    }
});



// Get All users for Admin
const getAllUsersService = CatchAsyncError(async (res, next) => {
    try{
        const users = await UserModel.find().sort({createdAt: -1})
        res.status(201).json({
            success: true,
            users: users
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