const mongoose = require('mongoose');

// FAQ Schema
const faqSchema = mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    }
});

// Category Schema
const categorySchema = mongoose.Schema({
    title: {
        type: String,
        required: true // Assuming title should be required
    }
});

// Banner Image Schema
const bannerImageSchema = mongoose.Schema({
    public_id: {
        type: String
    },
    url: {
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/[^\s$.?#].[^\s]*$/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    }
});

// Layout Schema
const layoutSchema = mongoose.Schema({
    type: {
        type: String,
        required : true
    },
    faq: [faqSchema],
    category: [categorySchema],
    banner: {
        image: bannerImageSchema,
        title: String,
        subTitle: String
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    versionKey: false // Removes the __v field
});

// Model Definition
const LayoutModel = mongoose.model('Layout', layoutSchema);

module.exports = LayoutModel;
