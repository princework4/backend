const express = require('express')
const { authenticateUser, authorizeRoles } = require('../middleware/auth')
const { getUserAnalytics, getCourseAnalytics, getOrderAnalytics } = require('../controllers/analytics.controller')
const AnalyticsRouter = express.Router()



AnalyticsRouter.get('/get-user-analytics', authenticateUser, authorizeRoles('admin'), getUserAnalytics);
AnalyticsRouter.get('/get-courses-analytics', authenticateUser, authorizeRoles('admin'), getCourseAnalytics);
AnalyticsRouter.get('/get-orders-analytics', authenticateUser, authorizeRoles('admin'), getOrderAnalytics);


module.exports = AnalyticsRouter