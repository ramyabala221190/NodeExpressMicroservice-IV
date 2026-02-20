import express from "express";
import orderController from "../controllers/orderController";

const orderRouter= express.Router();

orderRouter.route('/orders/:userName')
.get(orderController.getUserOrderDetail)
.post(orderController.createOrder)

orderRouter.route('/order/status')
.put(orderController.updateOrderStatus)

export default orderRouter;