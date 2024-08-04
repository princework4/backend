const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'unread'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to User model
        required: true // Uncomment if userId should be required
    }
}, { timestamps: true });

const NotificationModel = mongoose.model('Notification', notificationSchema);

module.exports = NotificationModel;
