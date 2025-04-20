const express = require('express');
const {authenticateUser, authorizeRoles, validateRefreshToken} = require('../middleware/auth.js');
const userRouter = express.Router();
const {
    registrationUser,
    purchaseSubscription,
    activateUser,
    loginUser,
    logoutUser,
    refreshToken,
    getUserInfo,
    socialAuth,
    updateUserInfo,
    updatePassword,
    updateProfilePicture,
    getAllUsers,
    updateUserRole,
    deleteUser
} = require("../controllers/user.controller.js");

userRouter.post('/registration', registrationUser)
userRouter.post('/verifyuser', activateUser)
userRouter.post('/login', loginUser)
userRouter.get('/logout', authenticateUser, logoutUser)
userRouter.get('/refresh-token', validateRefreshToken, refreshToken)
userRouter.get('/userinfo',authenticateUser, getUserInfo)
userRouter.post('/socialAuth', socialAuth)
userRouter.put('/updateuserinfo', authenticateUser, updateUserInfo)
userRouter.post('/updatepassword', authenticateUser,  updatePassword)
userRouter.put('/updateuseravatar', authenticateUser,  updateProfilePicture)
userRouter.post('/purchase-subscription', authenticateUser, purchaseSubscription)
userRouter.get('/get-all-users', authenticateUser, authorizeRoles("admin"), getAllUsers)
userRouter.put('/update-user-role', authenticateUser, authorizeRoles("admin"), updateUserRole)
userRouter.put('/delete-user', authenticateUser, authorizeRoles("user", "admin"), deleteUser)






module.exports = userRouter