const express = require('express');
const {registrationUser, activateUser, loginUser, logoutUser, refreshToken, getUserInfo, socialAuth, updateUserInfo, updatePassword, updateProfilePicture} = require("../controllers/user.controller.js");
const {authenticateUser, authorizeRoles, validateRefreshToken} = require('../middleware/auth.js');
const userRouter = express.Router();


userRouter.post('/registration', registrationUser)
userRouter.post('/verifyuser', activateUser)
userRouter.post('/login', loginUser)
userRouter.get('/logout', authenticateUser, authorizeRoles("user"), logoutUser)
userRouter.get('/refresh-token', validateRefreshToken, authorizeRoles("user"), refreshToken)
userRouter.get('/userinfo',authenticateUser, getUserInfo)
userRouter.post('/socialAuth', socialAuth)
userRouter.put('/updateuserinfo', authenticateUser, authorizeRoles("user"), updateUserInfo)
userRouter.post('/updatepassword', authenticateUser, authorizeRoles("user"), updatePassword)
userRouter.put('/updateuseravatar', authenticateUser, authorizeRoles("user"), updateProfilePicture)






module.exports = userRouter