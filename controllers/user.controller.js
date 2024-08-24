const jsonwebtoken = require('jsonwebtoken');
const ErrorHandler = require('../utils/errorHandler.js');
const sendEmail = require('../utils/sendMail.js');
const userModel = require('../models/user.model.js');
require('dotenv').config();
const CatchAsyncError = require('../middleware/catchAsyncError.js');
const sendToken = require('../utils/jwt.js');
const redis = require('../utils/redis.js');
const { getUserByID } = require('../services/getuser.js');
const cloudinary = require('cloudinary');
const cron = require('node-cron');
const  OrderModel = require('../models/order.model')
const moment = require("moment");
const {getAllUsersService, updateUserRoleService} = require("../services/getuser");

// Register User
const registrationUser = CatchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;

    const isEmailExist = await userModel.findOne({ email });
    if (isEmailExist) {
        return next(new ErrorHandler("Email already exists", 409));
    }

    const user = {
        name,
        email,
        password
    };

    const { token, activationCode } = createActivationToken(user);

    const data = { user: { name: user.name }, activationCode };

    // Try sending the activation email
    try {
        await sendEmail({
            email: user.email,
            subject: "Activate your account",
            template: "activationMail.ejs",
            data,
        });

        res.status(201).json({
            success: true,
            message: 'Please check your email to activate your account',
            activationToken: token
        });
    } catch (error) {
        return next(new ErrorHandler("Failed to send activation email: " + error.message, 500));
    }
});



const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jsonwebtoken.sign({ user, activationCode }, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m"
    });

    return { token, activationCode };
}




// Activate user
const activateUser = CatchAsyncError(async (req, res, next) => {
    try {
        const { activationToken, activationCode } = req.body;
        const decoded = jsonwebtoken.verify(activationToken, process.env.ACTIVATION_SECRET);

        if (decoded.activationCode !== activationCode) {
            return next(new ErrorHandler('Invalid activation code', 400));
        }

        const { name, email, password } = decoded.user;
        const existUser = await userModel.findOne({ email });

        if (existUser) {
            return next(new ErrorHandler('User already exists', 400));
        }

        const user = await userModel.create({
            name,
            email,
            password
        });
        
        sendToken(user, 200, res);
    } catch (error) {
        console.error('Error during user activation:', error);
        return next(new ErrorHandler(error.message, 400));
    }
});






// Login User
const loginUser = CatchAsyncError(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return next(new ErrorHandler('Kindly enter email', 400))
        } else if (!password) {
            return next(new ErrorHandler('Kindly enter password', 400))
        }
        const user = await userModel.findOne({ email }).select('+password');
        if (!user) {
            return next(new ErrorHandler('Invalid email or password', 401))
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new ErrorHandler('Incorrect Password', 401))
        }

        sendToken(user, 200, res);
    } catch (error) {
        return next(new ErrorHandler(error?.message, 400))
    }
})



// For Logging Out
const logoutUser = CatchAsyncError(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 0 });
        res.cookie("refresh_token", "", { maxAge: 0 });
        // Delete the user's session or related data from Redis
        await redis.del(req.user._id);
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        return next(new ErrorHandler('Error in logging out ' + error, 400));
    }
});



// For Refreshing Token
const refreshToken = CatchAsyncError(async (req, res, next) => {
    try {
        const findUser = await userModel.findOne({ email: req.user.email }).select();
        sendToken(findUser, 200, res)
    } catch (error) {
        return next(new ErrorHandler('Error in refreshing token ' + error, 400))
    }
});




// Getting User Information
const getUserInfo = CatchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id
        getUserByID(userId, res)
    } catch (error) {
        next(new ErrorHandler(error?.message, 400))
    }
})




// social auth 
const socialAuth = CatchAsyncError(async (req, res, next) => {
    try {
        const { email, name } = req.body
        const user = await userModel.findOne({ email })
        if (!user) {
            const newUser = await userModel.create({ email, name, ...req.body }); //Will check later
            sendToken(newUser, 200, res)
        }
        else {
            sendToken(user, 200, res)
        }
    } catch (error) {
        next(new ErrorHandler(error?.message, 400))
    }
});





// updateUserInfo
const updateUserInfo = CatchAsyncError(async (req, res, next) => {
    try {
        const { name, email } = req.body
        const userId = req.user._id

        const user = await userModel.findById(userId)

        if (email && user) {
            // Checking that entered email is already exists in DB or not
            const emailExist = await userModel.findOne({ email })
            if (emailExist) {
                return next(new ErrorHandler('Email already exists', 400))
            }
            // Update user email
            user.email = email
        }

        if (name && user) {
            user.name = name
        }

        await user?.save();

        // Updating user in redis client
        await redis.set(userId, JSON.stringify(user))

        res.status(201).json({
            success: true,
            user
        })

    } catch (error) {
        next(new ErrorHandler(error?.message, 400))
    }
});




// updateUserPassword
const updatePassword = CatchAsyncError(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body
        const userId = req.user._id


        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler('Please enter both old and new password', 400))
        }

        // check if both are same
        if (oldPassword === newPassword) {
            return next(new ErrorHandler('Old and new password cannot be same', 400))
        }

        if (!userId) {
            return next(new ErrorHandler('User not found', 400))
        } else {
            const user = await userModel.findById(userId).select('+password');

            const isValidPassword = user.comparePassword(oldPassword)

            if (!isValidPassword) {
                return next(new ErrorHandler('Old password is incorrect', 400))
            }

            // Updating the password here, not doing hash bcz in model there is predefined hash function it runs everytime when save happen
            user.password = newPassword
            await user?.save()
            await redis.set(userId, JSON.stringify(user))

            res.status(201).json({
                success: true,
                message: 'Password updated successfully'
            })
        }
    } catch (error) {
        next(new ErrorHandler(error?.message, 400))
    }
});






// Update Profile Picture
const updateProfilePicture = CatchAsyncError(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        const userId = req?.user?._id;

        if (!userId) {
            return next(new ErrorHandler('User ID not found', 400));
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        if (avatar) {
            // Check if user already has a profile picture
            if (user.avatar?.public_id) {
                // Destroy old avatar from Cloudinary
                await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            }

            // Upload new avatar to Cloudinary
            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: 'avatars',
                width: 150,
                crop: 'scale'
            });

            // Update user avatar details
            user.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }

        // Save user with updated profile picture
        await user.save();

        // Update user in Redis cache
        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        // Ensure proper error handling
        return next(new ErrorHandler(error.message || 'Internal server error', 500));
    }
});




// Update Subscription Details
const purchaseSubscription = CatchAsyncError(async (req, res, next) => {
    try{
        const {plan, payment_info} = req.body;
        const user = req.user;
        if(!plan || !payment_info){
            next(new ErrorHandler('Plan or Payment not found', 400));
        } else {
            const planStartDate = moment().toDate();
            let planEndDate = planStartDate;
            console.log(planEndDate);
            switch (plan) {
                case "monthly":
                    planEndDate = moment().add(30, 'days').toDate();
                    break;
                case "quarterly" :
                    planEndDate = moment().add(90, 'days').toDate();
                    break;
                case "half-yearly" :
                    planEndDate = moment().add(180, 'days').toDate();
                    break;
                case "yearly" :
                    planEndDate = moment().add(365, 'days').toDate();
                    break;
                default :
                    return next(new ErrorHandler('Invalid plan type', 400));
            }
            console.log(planEndDate)
            await userModel.updateOne(
                {_id : user._id },
                {$set : {"subscription.isActive": true, "subscription.startDate" : planStartDate, "subscription.endDate" : planEndDate, "subscription.plan" : plan}}
            );
            await OrderModel.create({
                isSubscription: true,
                userId : user._id,
                payment_info : payment_info
            })
            res.status(201).json({
                success : true,
                message : "Subscription purchased successfully"
            })
        }
    }catch(error){
        next(new ErrorHandler(error.message, 500));
    }
})



// Get All users -- For Admin Only
const getAllUsers = CatchAsyncError(async (req, res, next) => {
    try{
        getAllUsersService(res,next)
    }catch (e) {
        next(new ErrorHandler(e.message, 500))
    }
})



// Update User Role -- Admin Only
const updateUserRole = CatchAsyncError(async (req, res, next) => {
    try{
        const {role, userId} = req.body;
        await updateUserRoleService(userId, role, res, next)
    }catch (e) {
        next (new ErrorHandler(e.message, 500))
    }
});





// Delete User -- Admin Only
const deleteUser = CatchAsyncError(async (req, res, next) => {
    try{
        const {userId} = req.body

        if(!userId){
            next(new ErrorHandler('User not found', 401));
        }
        await  userModel.deleteOne({_id: userId})
        await  redis.del(userId)

        res.status(201).json({
            success : true,
            message : "User Deleted"
        })
    } catch (err){
        next(new ErrorHandler(err.message, 500))
    }
})






// Updating the user subscription if it has expired
cron.schedule("0 0 0 * * *", async () => {
    const today = moment().startOf('day').toDate();
    await userModel.updateMany(
        { "subscription.isActive": true, "subscription.endDate": { $lt: today } },
        { $set: { "subscription.isActive": false } }
    );
    console.log("Subscription job run success")
});




module.exports = {
    registrationUser,
    activateUser,
    loginUser,
    logoutUser,
    refreshToken,
    getUserInfo,
    socialAuth,
    updateUserInfo,
    updatePassword ,
    updateProfilePicture,
    purchaseSubscription,
    getAllUsers,
    updateUserRole,
    deleteUser
};
