const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { uploadCourse, editCourse,  getSingleCourseDetails, getAllCoursesDetails, getCourseByUser, addQuestion,
    addQuestionReplies, addCourseReview, getAllCourses,
    deleteCourse
} = require('../controllers/course.controller');
const courseRouter = express.Router();



courseRouter.post('/createCourse', authenticateUser, authorizeRoles("admin"), uploadCourse)
courseRouter.put('/editCourse', authenticateUser, authorizeRoles("admin"), editCourse)
courseRouter.get('/getCourse',  getSingleCourseDetails)
courseRouter.get('/getAllCourses',  getAllCoursesDetails)
courseRouter.get('/getCourse-content', authenticateUser, getCourseByUser)
courseRouter.put('/addquestion', authenticateUser, addQuestion)
courseRouter.put('/addquestion-replies', authenticateUser, addQuestionReplies);
courseRouter.put('/addReview', authenticateUser, addCourseReview)
courseRouter.get('/get-all-courses', authenticateUser, authorizeRoles("admin"), getAllCourses)
courseRouter.delete('/delete-course', authenticateUser, authorizeRoles("admin"), deleteCourse)


module.exports = courseRouter