const express = require('express');
const OrderRouter = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const {createOrder, getAllOrders} = require("../controllers/order.controller");


OrderRouter.post('/create-order', authenticateUser,  createOrder);
OrderRouter.get('/get-all-orders', authenticateUser, authorizeRoles("admin"), getAllOrders);

module.exports = OrderRouter;