const CatchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const cloudinary = require('cloudinary');
const { getAllCoursesService } = require('../services/course');
const CourseModel = require('../models/course.model');
const redis = require('../utils/redis.js');
const mongoose = require("mongoose");
const sendEmail = require('../utils/sendMail.js');
const NotificationModel = require('../models/notification.model');
const userModel = require('../models/user.model.js');


// Upload Course
const uploadCourse = CatchAsyncError(async (req, res, next) => {
    try {
        const data = req.body;
        if (!req.user || !req.user._id) {
            return next(new ErrorHandler("User not authenticated", 401));
        }
        if (!data || !data.thumbnail || !data.name) {
            return next(new ErrorHandler("Missing required course data", 400));
        }

        const { thumbnail } = data;
        if (thumbnail) {
            try {
                const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "thumbnail"
                });
                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                };
            } catch (uploadError) {
                return next(new ErrorHandler(`Cloudinary upload failed: ${uploadError.message}`, 500));
            }
        }

        const course = await CourseModel.create(data);

        // Create a notification for the user
        await NotificationModel.create({
            userId: req.user._id,
            title: "New course added",
            message: `You have a new course ${course.name} pending for approval.`
        });

        const mailData = {
            name: req?.user?.name,
            courseTitle: course?.name
        };

        await sendEmail({
            email: req.user.email,
            subject: "Course Added",
            template: "courseUploadMail.ejs",
            data: mailData
        });

        res.status(201).json({
            success: true,
            message: "Course created successfully",
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});




// Edit Course 
const editCourse = CatchAsyncError(async (req, res, next) => {
    try {
        const data = req.body;
        const courseId = req.query.CourseId;

        if (data.thumbnail) {
            // Ensure thumbnail is either a URL or file path
            const currentCourse = await CourseModel.findById(courseId);
            if (currentCourse && currentCourse.thumbnail && currentCourse.thumbnail.public_id) {
                // Destroy the existing thumbnail
                await cloudinary.v2.uploader.destroy(currentCourse.thumbnail.public_id);
            }

            // Upload the new thumbnail
            const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
                folder: "courses"
            });

            // Update the thumbnail data
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }

        // Update the course with new data
        const course = await CourseModel.findByIdAndUpdate(courseId, {
            $set: data
        }, {
            new: true
        });

        res.status(201).json({
            success: true,
            course
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});





// Get Single Course -- Without Purchasing the course everyone can access the course details
const getSingleCourseDetails = CatchAsyncError(async (req, res, next) => {
    try {
        const courseId = req.query.courseId;
        const course = await CourseModel.findById(courseId).select('-courseData.videoUrl -courseData.questions -courseData.links -courseData.suggestion')
        res.status(201).json({
            success: true,
            course
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500))
    }
});



// Get Trending Courses
const getTrendingCourses = CatchAsyncError(async (req, res, next) => {
    try {
        const courses = await CourseModel.aggregate([
            {
                $match : {
                    isApproved : true
                }
            },
            {
                $sort: {
                    ratings: -1,
                    purchased: -1
                }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    'courseData.videoUrl': 0,
                    'courseData.questions': 0,
                    'courseData.links': 0,
                    'courseData.suggestion': 0
                }
            }
        ]);
        res.status(200).json({
            success: true,
            courses
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});


// Get All Courses - Without Purchase
const getAllCoursesDetails = CatchAsyncError(async (req, res, next) => {
    try {
        const cachedCourses = await redis.get("allCourses");
        if (cachedCourses) {
            const parsedCoursesData = JSON.parse(cachedCourses)
            res.status(200).json({
                success: true,
                parsedCoursesData
            })
        } else {
            const allCourse = await CourseModel.find({ isApproved: true }).select('-courseData.videoUrl -courseData.questions -courseData.links -courseData.suggestion')
            await redis.set("allCourses", JSON.stringify(allCourse))
            res.status(201).json({
                success: true,
                parsedCoursesData : allCourse
            });
        }

    } catch (error) {
        next(new ErrorHandler(error.message, 500))
    }
});



// Get All Courses for approve - Admin Only
const getAllCoursesForApproval = CatchAsyncError(async (req, res, next) => {
    try {
        const allCourse = await CourseModel.find({ isApproved: false }).select('-courseData.videoUrl -courseData.questions -courseData.links -courseData.suggestion')
        res.status(201).json({
            success: true,
            courses: allCourse
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500))
    }
});


// Approve Course - Admin Only
const approveCourse = CatchAsyncError(async (req, res, next) => {
    try {
        const { isApprove, courseId, reason } = req.body;
        if (typeof isApprove !== 'boolean' || !courseId) {
            return next(new ErrorHandler('Invalid request data', 400));
        }

        //  Finding the course and the user who created it
        const createdBy = await userModel.findById(req.user._id);
        if (!createdBy) {
            return next(new ErrorHandler('User not found', 404));
        }

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler('Course not found', 404));
        }

        if (isApprove) {
            course.isApproved = true;
            await course.save();

            const mailData = {
                name: createdBy.name,
                courseTitle: course.name
            };

            await sendEmail({
                email: createdBy.email,
                subject: "Course Approved",
                template: "courseApproveMail.ejs",
                data: mailData
            });

            res.status(200).json({
                success: true,
                message: 'Course Approved'
            });

        } else {
            // Storing course details before deleting
            const courseTitle = course.name || 'Unknown course';

            await course.deleteOne();

            const mailData = {
                name: createdBy.name,
                courseTitle: courseTitle,
                reason: reason || 'No reason provided'
            };

            await sendEmail({
                email: createdBy.email,
                subject: "Course Rejected",
                template: "courseRejectMail.ejs",
                data: mailData
            });

            res.status(200).json({
                success: true,
                message: 'Course Rejected'
            });
        }

        // Clear Redis cache
        await redis.del("allCourses");

    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});





// Get Course By User -- Checking if the user has purchased a course or not
const getCourseByUser = CatchAsyncError(async (req, res, next) => {
    try {
        const courseId = req.query.courseId;

        if (!req.user) {
            return next(new ErrorHandler('User not authenticated', 401));
        }
        const purchasedCoursesByUser = req.user.courses || [];
        const isSubscribedUser = req.user.subscription?.isActive;

        // Checking if the course exists in the purchased courses
        const courseExist = purchasedCoursesByUser.some((item) => item._id.toString() === courseId);

        if (courseExist) {
            let course = await CourseModel.findById(courseId).select('courseData');
            if (!course) {
                return next(new ErrorHandler('Course not found', 404));
            }
            res.status(200).json({
                success: true,
                course: course.courseData // Only sending the courseData to the frontend
            });
        } else if (isSubscribedUser) { // Check if the user has an active subscription
            let course = await CourseModel.findById(courseId).select('courseData');
            if (!course) {
                return next(new ErrorHandler('Course not found', 404));
            }
            res.status(200).json({
                success: true,
                course: course.courseData
            });
        } else {
            res.status(403).json({
                success: false,
                message: "You haven't purchased this course yet"
            });
        }

    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});




// Add Questions to courseData
const addQuestion = CatchAsyncError(async (req, res, next) => {
    try {
        const { question, courseId } = req.body;
        const user = req.user

        // Validate courseId 
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return next(new ErrorHandler('Invalid course ID', 400));
        }

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler('Course not found', 404));
        }

        // Checking purchased courses
        const purchasedCoursesByUser = user.courses || [];
        const isSubscribedUser = user.subscription?.isActive;

        // Checking if the course exists in the purchased courses
        const courseExist = purchasedCoursesByUser.some((item) => item?.courseId?.toString() === courseId);

        // Check if the course is purchased or the user is subscribed
        if (!courseExist && !isSubscribedUser) {
            return next(new ErrorHandler('You cannot ask questions until course is is purchased', 403));
        }


        // Create new question
        const newQuestion = {
            user: { id: req.user._id, email: req.user.email },
            question: question,
            questionReplies: []
        };

        // Add the new question to the course content
        course.questions = course.questions || []; // Ensure questions array exists
        course.questions.push(newQuestion);


        // Creating a Notification for the Question
        await NotificationModel.create({
            userId: req.user._id,
            title: "New Question",
            message: `You have a new question in ${course?.title}!`,
        })

        // Save the course with the new question
        await course.save();

        res.status(201).json({
            success: true,
            message: 'Question added successfully',
            question: newQuestion
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});




// Add Question Replies
const addQuestionReplies = CatchAsyncError(async (req, res, next) => {
    try {
        const { answer, courseId, questionId } = req.body;

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(courseId) ||
            // !mongoose.Types.ObjectId.isValid(contentId) ||
            !mongoose.Types.ObjectId.isValid(questionId)) {
            return next(new ErrorHandler('Invalid course, content, or question ID', 400));
        }

        // Find course by ID
        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler('Course not found', 404));
        }

        // // Find course content by contentId
        // const courseContent = course.courseData.find(item => item._id.toString() === contentId);
        // if (!courseContent) {
        //     return next(new ErrorHandler('Content not found', 404));
        // }

        // Find question content by questionId
        const questionContent = course?.questions?.find(item => item._id.toString() === questionId);
        if (!questionContent) {
            return next(new ErrorHandler('Question not found', 404));
        }

        // Create new answer object
        const newAnswer = {
            answer,
            user: req.user._id
        };

        // Add new answer to questionReplies
        questionContent.questionReplies = questionContent.questionReplies || [];
        questionContent.questionReplies.push(newAnswer);
        console.log(questionContent)

        // Save the updated course document
        await course.save();

        if (req.user._id === questionContent.user._id) {
            await NotificationModel.create({
                userId: req.user._id,
                title: "New Question reply received",
                message: `You have a new reply in ${course?.title}!`,
            })
        } else {
            const data = {
                name: questionContent.user.name,
                title: course.title,
                websiteUrl: "https://google.com"
            }

            try {
                await sendEmail({
                    email: questionContent.user.email,
                    subject: "New Reply",
                    template: "questionReply.ejs",
                    data
                })
            } catch (e) {
                next(new ErrorHandler(e.message, 500))
            }
        }

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Answer added successfully',
            answer: newAnswer
        });

    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});








// Add Course Review
const addCourseReview = CatchAsyncError(async (req, res, next) => {
    try {
        const { courseId, rating, comment } = req.body;
        const user = req.user;
        if (!user || !courseId || !rating || !comment) {
            return next(new ErrorHandler('Please enter all details', 400));
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return next(new ErrorHandler('Rating must be between 1 and 5', 400));
        }

        // Checking purchased courses
        const purchasedCoursesByUser = user.courses || [];
        const isSubscribedUser = user.subscription?.isActive;

        // Checking if the course exists in the purchased courses
        const courseExist = purchasedCoursesByUser.some((item) => item?.courseId?.toString() === courseId);

        // Check if the course is purchased or the user is subscribed
        if (!courseExist && !isSubscribedUser) {
            return next(new ErrorHandler('Course not purchased or subscription not active', 403));
        }

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler('Course not found', 404));
        }


        // Checking if the user already submitted the review
        const reviewAlreadySubmitted = course.reviews.some(review => review?.user?.id === user._id);
        if (reviewAlreadySubmitted) {
            return next(new ErrorHandler('You already submitted the review', 403));
        }
        // Creating new review
        const review = {
            user: {
                id: user._id,
                name: user.name,
            },
            rating,
            comment,
        };

        course.reviews.push(review);
        await course.save();

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
        });

    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});


// Get All courses purchased by user
const getMyCourses = CatchAsyncError(async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return next(new ErrorHandler('Authentication Failed', 401));
        }

        // Ensure user.courses is an array
        const courses = user.courses?.map((item) =>
            CourseModel.findById(item._id).select('-courseData -tags -benefits -prerequisites -questions')
        ) || [];

        // Wait for all promises to resolve and filter out null/undefined values
        const coursesPurchased = (await Promise.all(courses)).filter(course => course);
        console.log(coursesPurchased)

        // Check if the array is empty and return the response accordingly
        if (coursesPurchased?.length === 0) {
            return res.status(200).json({
                success: true,
                myCourses: null,
            });
        }

        res.status(200).json({
            success: true,
            myCourses: coursesPurchased,
        });
    } catch (e) {
        return next(new ErrorHandler(e.message, 500));
    }
});




// Get All Courses -- Admin Only
const getAllCourses = CatchAsyncError(async (req, res, next) => {
    try {
        getAllCoursesService(req, res, next)
    } catch (e) {
        next(new ErrorHandler((e.message, 500)))
    }
});







// Delete Course -- Admin Only
const deleteCourse = CatchAsyncError(async (req, res, next) => {
    try {
        const { courseId } = req.body

        if (!courseId) {
            next(new ErrorHandler('Course not found', 401));
        }
        await CourseModel.deleteOne({ _id: courseId })
        await redis.del(courseId)

        res.status(201).json({
            success: true,
            message: "Course Deleted"
        })
    } catch (err) {
        next(new ErrorHandler(err.message, 500))
    }
})





module.exports = {
    uploadCourse,
    editCourse,
    getSingleCourseDetails,
    getAllCoursesDetails,
    getCourseByUser,
    addQuestion,
    addQuestionReplies,
    addCourseReview,
    getAllCourses,
    deleteCourse,
    getMyCourses,
    getAllCoursesForApproval,
    approveCourse,
    getTrendingCourses
}