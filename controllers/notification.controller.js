const CatchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const NotificationModel = require('../models/notification.model.js')
const cron = require('node-cron');
const moment = require("moment");


// Get Notifications --Only for Admin
const getNotifications = CatchAsyncError(async (req, res, next) => {
    try {
        const notifications = await NotificationModel.find().sort({createdAt : -1});
        console.log(notifications)
        res.status(201).json({
            status: 'success',
            data: notifications
        })
    } catch (error) {
        next(new ErrorHandler(error, 500))
    }
});



// Update Notifications
const updateNotification = CatchAsyncError(async(req, res, next) => {
    try {
        const notification = await NotificationModel.findById(req.body.notificationId)
        if(!notification) {
            return next(new ErrorHandler('Notification not found', 404))
        } else if(notification.status !== "read"){
            notification.status = "read"
            await notification.save()
            res.status(201).json({
                status: 'success',
                message: 'Notification updated successfully'
            })
        }
    } catch (error) {
        next (new ErrorHandler(error.message, 500))
    }
});



// Deleting notification after 15 days
cron.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgoDate = moment().subtract(30, 'days').toDate();
    await NotificationModel.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgoDate } });
    console.log("Deleted old notifications")
});


module.exports = {getNotifications, updateNotification}

