import Razorpay from "razorpay";

console.log("RAZORPAY_API_KEY", process.env.RAZORPAY_API_KEY)
console.log("RAZORPAY_API_SECRET", process.env.RAZORPAY_API_SECRET)
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY, // Set this in your .env file
    key_secret: process.env.RAZORPAY_API_SECRET, // Set this in your .env file
});

export default razorpayInstance;
