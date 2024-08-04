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
userRouter.put('/updateuserinfo', authenticateUser, authorizeRoles("user"), updateUserInfo)
userRouter.post('/updatepassword', authenticateUser, authorizeRoles("user"), updatePassword)
userRouter.put('/updateuseravatar', authenticateUser, authorizeRoles("user"), updateProfilePicture)
userRouter.post('/purchase-subscription', authenticateUser, authorizeRoles("user"), purchaseSubscription)
userRouter.get('/get-all-users', authenticateUser, authorizeRoles("admin"), getAllUsers)
userRouter.put('/update-user-role', authenticateUser, authorizeRoles("admin"), updateUserRole)
userRouter.delete('/delete-user', authenticateUser, authorizeRoles("admin"), deleteUser)






module.exports = userRouter