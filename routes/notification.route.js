const express = require('express');
const NotificationRouter = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const {updateNotification, getNotifications} = require('../controllers/notification.controller');


NotificationRouter.get('/notifications', authenticateUser, authorizeRoles('admin'), getNotifications);
NotificationRouter.put('/update-notifications', authenticateUser, authorizeRoles('admin'), updateNotification);

module.exports = NotificationRouter;