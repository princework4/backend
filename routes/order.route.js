const express = require('express');
const OrderRouter = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const {createOrder, getAllOrders, createOrderV1, verifyPayment} = require("../controllers/order.controller");


OrderRouter.post('/create-order', authenticateUser,  createOrder);
OrderRouter.post('/create-order-v1', authenticateUser,  createOrderV1);
OrderRouter.post('/verify-payment', authenticateUser,  verifyPayment);
OrderRouter.get('/get-all-orders', authenticateUser, authorizeRoles("admin"), getAllOrders);

module.exports = OrderRouter;