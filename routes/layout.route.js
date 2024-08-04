const express = require('express')
const layoutRouter = express.Router()
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { createLayout, editLayout, getLayout } = require('../controllers/layout.controller');


layoutRouter.post('/create-layout', authenticateUser, authorizeRoles('admin'), createLayout);
layoutRouter.put('/edit-layout', authenticateUser, authorizeRoles('admin'), editLayout);
layoutRouter.get('/get-layout', getLayout);

module.exports = layoutRouter