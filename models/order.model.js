const mongoose = require('mongoose');

const PaymentInfoSchema = new mongoose.Schema({
    transactionId: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    paymentDate: { type: Date, required: true }
}, { _id: false }); // _id: false to avoid creating an additional _id field in the embedded schema

const OrderSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseModel', // Assuming you have a Course model
    },
    isSubscription : {
        type: Boolean,
        default: false
    },
    userId: {
        type: String,
        required: true,
        // unique: true // Ensure each orderId is unique
    },
    payment_info: {
        type: PaymentInfoSchema, // Use the defined schema for payment_info
        required: true
    }
}, { timestamps: true });

const OrderModel = mongoose.model('Order', OrderSchema);

module.exports = OrderModel;
