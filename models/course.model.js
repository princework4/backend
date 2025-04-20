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
    links: {
        title: String,
        url: String,
    },
    suggestion: String,
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
            required: true,
            type: String
        },
        url: {
            required: true,
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
    purchased: {
        type: Number,
        default: 0
    },
    questions: [commentSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isApproved : {
        type: Boolean,
        default: false
    },
    category : {
        type : String,
        required : true
    }
}, { timestamps: true });






// Creating a virtual for calculating the average rating
courseSchema.virtual('ratings').get(function () {
    if (this.reviews.length === 0) {
        return 0
    } else {
        const total = this.reviews.reduce((acc, item) => acc + item.rating, 0)
        const average = total / this.reviews.length;
        return Math.round(average * 2) / 2
    }
})


// Convert the virtual field to JSON and Object outputs
courseSchema.set('toObject', { virtuals: true });
courseSchema.set('toJSON', { virtuals: true });




const CourseModel = mongoose.model("Course", courseSchema);
module.exports = CourseModel;
