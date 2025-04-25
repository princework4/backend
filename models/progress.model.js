const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
    },
    watchedDuration: {
        type: Number,
        default: 0, // in seconds
    },
    percentageWatched: {
        type: Number,
        default: 0, // 0 to 100
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        trim: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Progress', progressSchema);
