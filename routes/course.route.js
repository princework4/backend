const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { uploadCourse, editCourse,  getSingleCourseDetails, getAllCoursesDetails, getCourseByUser, addQuestion,
    addQuestionReplies, addCourseReview, getAllCourses,
    deleteCourse,
    getMyCourses,
    getAllCoursesForApproval,
    approveCourse,
    getTrendingCourses,
} = require('../controllers/course.controller');
const courseRouter = express.Router();



courseRouter.post('/createCourse', authenticateUser, authorizeRoles("admin"), uploadCourse)
courseRouter.put('/editCourse', authenticateUser, authorizeRoles("admin"), editCourse)
courseRouter.get('/my-courses', authenticateUser, getMyCourses)
courseRouter.get('/getCourse', getSingleCourseDetails)
courseRouter.get('/getAllCourses', getAllCoursesDetails)
courseRouter.get('/get-trending-courses', getTrendingCourses)
courseRouter.get('/getCourse-content', authenticateUser, getCourseByUser)
courseRouter.put('/addquestion', authenticateUser, addQuestion)
courseRouter.put('/addquestion-replies', authenticateUser, addQuestionReplies);
courseRouter.put('/addReview', authenticateUser, addCourseReview)
courseRouter.get('/get-all-courses', authenticateUser, authorizeRoles("admin", "mentor"), getAllCourses)
courseRouter.delete('/delete-course', authenticateUser, authorizeRoles("admin"), deleteCourse)
courseRouter.get('/courses-to-approve', authenticateUser, authorizeRoles('admin'), getAllCoursesForApproval)
courseRouter.put('/approve-course', authenticateUser, authorizeRoles('admin'), approveCourse)


module.exports = courseRouter