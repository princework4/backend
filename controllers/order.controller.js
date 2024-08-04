const CatchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler.js');
const CourseModel = require('../models/course.model');
const sendEmail = require('../utils/sendMail.js');
const UserModel = require('../models/user.model');
const NotificationModel = require('../models/notification.model');
const OrderModel = require('../models/order.model');
const {getAllCoursesService} = require("../services/course");
const {getAllOrderService} = require("../services/order");



//Create Order
const createOrder = CatchAsyncError(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;

        // Fetch the user
        const user = await UserModel.findById(req.user._id);

        // Check if the user has already purchased this course
        const courseExistInUser = user.courses.some(course => course._id.toString() === courseId);
        const isSubscribedUser = user.subscription.isActive


        if (courseExistInUser || isSubscribedUser) {
            return next(new ErrorHandler('User already purchased this course or you are already subscribed', 401));
        }

        // Fetch the course
        const course = await CourseModel.findById(courseId);

        if (!course) {
            return next(new ErrorHandler('Course not found', 404));
        }


        // Create the order
        const data = {
            courseId: course._id,
            userId: user._id,
            payment_info: payment_info // Include payment_info in the order data
        };

        // Ensure newOrder is correctly defined and awaited if it returns a promise
        const order = await OrderModel.create(data);


        // Increase course purchase count
        course.purchased = (course.purchased || 0) + 1;
        await course.save(); // Save the updated course

        // Prepare mail data
        const mailData = {
            order: {
                _id: order._id ,// Use the ID of the newly created order
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            }
        };

        // Send confirmation email
        try {
            await sendEmail({
                email: user.email,
                subject: "Course Purchased Successfully",
                template: "orderConfirmationMail.ejs",
                data : mailData
            });
        } catch (e) {
            return next(new ErrorHandler(e.message, 500));
        }

        // Add course to user's purchased courses
        user.courses.push(course._id);
        await user.save();

        // Send notification to admin
        await NotificationModel.create({
            userId: user._id,
            title: "New Order",
            message: `You have a new order for ${course.name}`,
            status: "unread",
        });


        // Send response
        res.status(201).json({
            success: true,
            order: order // Return the created order
        });

    } catch (e) {
        next(new ErrorHandler(e.message, 500));
    }
});



// Get All Orders -- Admin Only
const getAllOrders = CatchAsyncError(async (req, res, next) => {
    try{
        getAllOrderService(res,next)
    }catch (e) {
        next(new ErrorHandler((e.message, 500)))
    }
})




module.exports = {createOrder, getAllOrders}