
const CatchAsyncError = require("../middleware/catchAsyncError");
const OrderModel = require("../models/order.model");
const ErrorHandler = require("../utils/errorHandler");



// Get All orders for Admin
const getAllOrderService = CatchAsyncError(async (res, next) => {
    try{
        const orders = await OrderModel.find().sort({createdAt: -1})
        res.status(201).json({
            success: true,
            orders: orders
        })
    }catch(err){
        next(new ErrorHandler(err.message, 500));
    }
});


module.exports = {getAllOrderService}