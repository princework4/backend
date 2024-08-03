const  bcrypt  = require('bcryptjs');
const { Document, Model, Schema } = require('mongoose');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')

const emailRegExp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        validate: {
            validator: function (value) {
                return emailRegExp.test(value);
            },
            message: "Please enter a valid Email"
        },
        unique: true
    },
    password: {
        type: String,
        // required: [true, "Please enter your password"],
        minlength: [6, "Password must be atleast 6 characters"],
        select: false
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: "user"
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    subscription: {
        isActive: { type: Boolean, default: false },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        plan: { type: String, default: null }
    },
    courses: [
        {
            courseId: String
        }
    ]
}, { timestamps: true });

// Pre-save middleware to hash the password before saving the user
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


// Signing In Access Token
userSchema.methods.signInAccessToken = function(){
    return jwt.sign({id: this._id}, process.env.ACCESS_TOKEN_SECRET, { expiresIn : "5m"});
}

// Refreshing Access Token
userSchema.methods.refreshAccessToken = function (){
    return jwt.sign({id : this._id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn : "3d"});
}

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};

const userModel = mongoose.model("User", userSchema);

module.exports = userModel
