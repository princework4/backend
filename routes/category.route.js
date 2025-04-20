const express = require('express')
const CategoryRouter = express.Router()
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { addCategoryMaster, getCategoryMaster } = require('../controllers/category.controller');


CategoryRouter.post('/create-category', authenticateUser, authorizeRoles('admin'), addCategoryMaster);
CategoryRouter.get('/get-category', getCategoryMaster);

module.exports = CategoryRouter