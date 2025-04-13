const crypto = require("crypto");
const CatchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler.js');
const CourseModel = require('../models/course.model');
const sendEmail = require('../utils/sendMail.js');
const UserModel = require('../models/user.model');
const NotificationModel = require('../models/notification.model');
const OrderModel = require('../models/order.model');
const {getAllCoursesService} = require("../services/course");
const {getAllOrderService} = require("../services/order");


const razorpayInstance = require("../services/razorpay.js").default;

const createOrderV1 = CatchAsyncError(async (req, res, next) => {
    try {
        const { courseId } = req.body;
        const user = await UserModel.findById(req.user._id);

        // console.log("user", user)
        // console.log("courseId", courseId)
        // console.log("razorpayInstance", razorpayInstance)
        // console.log("razorpayInstance.orders", razorpayInstance.orders)
        // Check if the user already purchased the course
        const courseExistInUser = user.courses.some(course => course?._id.toString() === courseId);
        const isSubscribedUser = user.subscription.isActive;

        if (courseExistInUser || isSubscribedUser) {
            return next(new ErrorHandler('User already purchased this course or you are already subscribed', 401));
        }

        // Fetch the course
        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler('Course not found', 404));
        }
       console.log("course", course)
        // Create a Razorpay order
        const razorpayOrder = await razorpayInstance.orders.create({
            amount: 1000 * 100, // Razorpay expects the amount in paisa (₹1 = 100 paisa)
            currency: "INR",
            receipt: `order_rcptid_${user._id}`,
            payment_capture: 1, // Auto-capture the payment
        });
        // console.log("razorpayOrder", razorpayOrder)
        // Send the Razorpay order details to frontend
        res.status(200).json({
            success: true,
            orderId: razorpayOrder?.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount,
            key: process.env.RAZORPAY_KEY_ID, // Send the key to frontend for processing
        });

    } catch (e) {
        console.log("e", e)
        next(new ErrorHandler(e.message, 500));
    }
});


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


const verifyPayment = CatchAsyncError(async (req, res, next) => {
    console.log("inside", req.body)
    let parsedBody = req.body;

    // If req.body is a stringified JSON, parse it
    if (typeof req.body === "string") {
        parsedBody = JSON.parse(Object.keys(req.body)[0]);
        console.log("inside 2", req.body)

    }
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;
        console.log("","inside two", "razorpay_order_id:", razorpay_order_id, "razorpay_payment_id:", razorpay_payment_id, "razorpay_signature:",razorpay_signature, "courseId",courseId)
        console.log("process.env.RAZORPAY_KEY_SECRET",process.env.RAZORPAY_API_SECRET)

        // Generate the expected signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return next(new ErrorHandler("Payment verification failed", 400));
        }

        // Fetch user
        const user = await UserModel.findById(req.user._id);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Fetch the course
        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        console.log("hereeeee ", {
            courseId: course._id,
            userId: user._id,
            isSubscription: false,
            payment_info: {
                orderId: razorpay_order_id,
                transactionId: razorpay_payment_id,
                paymentMethod: razorpay_order_id,
                amount: course.price,
                currency: "INR",
                signature: razorpay_signature,
                status: "Paid",
                paymentDate: new Date(),
            },
        })
        // Store payment details in the database
        const order = await OrderModel.create({
            courseId: course._id,
            userId: user._id,
            isSubscription: false,
            payment_info: {
                orderId: razorpay_order_id,
                transactionId: razorpay_payment_id,
                paymentMethod: razorpay_order_id,
                amount: course.price,
                currency: "INR",
                signature: razorpay_signature,
                status: "Paid",
                paymentDate: new Date(),
            },
        });

        // Update the course purchase count
        course.purchased = (course.purchased || 0) + 1;
        await course.save();

        // Add course to user
        user.courses.push(course._id);
        await user.save();

        // Send confirmation email
        await sendEmail({
            email: user.email,
            subject: "Course Purchased Successfully",
            template: "orderConfirmationMail.ejs",
            data: {
                order: {
                    _id: order._id,
                    name: course.name,
                    price: course.price,
                    date: new Date().toLocaleDateString(),
                },
            },
        });

        // Notify admin
        await NotificationModel.create({
            userId: user._id,
            title: "New Order",
            message: `You have a new order for ${course.name}`,
            status: "unread",
        });

        // Send response
        res.status(200).json({
            success: true,
            message: "Payment successful, order placed.",
            order,
        });

    } catch (e) {
        next(new ErrorHandler(e.message, 500));
    }
});



module.exports = {createOrder, getAllOrders, createOrderV1, verifyPayment}