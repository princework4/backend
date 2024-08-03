const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')


const reviewSchema = new mongoose.Schema({
    user: Object,
    rating: {
        type: Number,
        default: 0
    },
    comment: String,
})



const linkSchema = new mongoose.Schema({
    title: String,
    url: String,
});





const commentSchema = new mongoose.Schema({
    user: Object,
    question: String,
    questionReplies: [Object]
})


const courseDataSchema = new mongoose.Schema({
    videoUrl: String,
    title: String,
    videoSection: String,
    description: String,
    videoLength: Number,
    VideoPlayer: String,
    links: [linkSchema],
    suggestion: String,
    questions: [commentSchema]
})




const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    estimatedPrice: {
        type: Number,
    },
    thumbnail: {
        public_id: {
            // required: true,
            type: String
        },
        url: {
            // required: true,
            type: String
        }
    },
    tags: {
        type: [String],
        required: true
    },
    level: {
        type: String,
        required: true
    },
    demoUrl: {
        type: String,
        required: true
    },
    benefits: [
        {
            title: String
        }
    ],
    prerequisites: [
        {
            title: String
        }
    ],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0
    },
    purchased: {
        type: Number,
        default: 0
    }
});


const CourseModel = mongoose.model("Course", courseSchema);
module.exports = CourseModel;
