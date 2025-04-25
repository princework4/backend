const CatchAsyncError = require('../middleware/catchAsyncError.js');
const ErrorHandler = require('../utils/errorHandler.js');
const progressModel = require('../models/progress.model.js');
const CourseModel = require('../models/course.model.js');

const videoProgress = CatchAsyncError(async (req, res, next) => {
    const { courseId, videoId, watchedDuration, percentageWatched, isCompleted } = req.body;

    const userId = req.user._id

    if(!userId){
        return next(new ErrorHandler('Please Log In Or SignUp', 401));
    }

    if (!courseId || !videoId) {
        return next(new ErrorHandler('userId, courseId, and videoId are required', 400));
    }

    try {
        await progressModel.findOneAndUpdate(
            { userId, courseId, videoId },
            {
                watchedDuration,
                percentageWatched,
                isCompleted: isCompleted || false,
                lastUpdated: new Date(),
            },
            { upsert: true, new: true }
        );
        return res.status(200).json({ success: true, message: 'Progress updated successfully' });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});







const checkCourseCompletion = CatchAsyncError(async (req, res, next) => {
    const { courseId } = req.body;
    const userId = req?.user?._id;
    if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!courseId) {
        return next(new ErrorHandler("courseId is required", 400));
    }

    // 1. Get course and its videos
    const course = await CourseModel.findById(courseId);
    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }

    const videoData = course?.courseData || []; // Assuming courseData is an array of videos
    const videoIds = videoData.map(video => video._id.toString());

    // 2. Get user's progress for completed videos
    const completedProgress = await progressModel.find({
        userId,
        courseId,
        // isCompleted: true
    });

    const completedIds = completedProgress.map(p => p.videoId.toString());

    // 3. Prepare response for completed videos
    const completedVideos = completedProgress.map(progress => {
        const videoDetails = videoData.find(v => v._id.toString() === progress.videoId.toString());

        return {
            videoId: progress.videoId,
            title: videoDetails?.title || "Untitled",
            watchedDuration: progress.watchedDuration || 0,
            percentageWatched: progress.percentageWatched || 0,
        };
    });

    // 4. Check if all videos are completed
    const isCourseCompleted = videoIds.every(id => completedIds.includes(id));

    return res.status(200).json({
        success: true,
        courseCompleted: isCourseCompleted,
        totalVideos: videoIds.length,
        completedVideos: completedVideos.length,
        videosCompletedDetails: completedVideos
    });
});





module.exports = { videoProgress , checkCourseCompletion};
