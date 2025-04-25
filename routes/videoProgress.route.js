const express = require('express')
const { authenticateUser, authorizeRoles } = require('../middleware/auth')
const { videoProgress, checkCourseCompletion } = require('../controllers/videoProgress.controller');
const VideoProgress = express.Router()



VideoProgress.post('/update-video-progress', authenticateUser, videoProgress);
VideoProgress.post('/check-course-progress', authenticateUser, checkCourseCompletion);


module.exports = VideoProgress