import { NextFunction, Request, Response } from "express";
import orderService from "../services/orderService";

class OrderController{

 constructor(){
    console.log("OrderController instantiated")
 } 

 async createOrder(req:Request,res:Response,next:NextFunction){
   try{
    const orderDetail= await orderService.createOrderService(req.body.orderPayload);
    res.status(200).json({message:"Order created successfully",orderDetail:orderDetail});

   }
   catch(err){
    next(err);
   }
 }

 async updateOrderStatus(req:Request,res:Response,next:NextFunction){
    try{
    const orderDetail=await orderService.updateOrderStatusService(req.body.orderId);
    if(orderDetail !== null){
    res.status(200).json({message:"Order completed successfully",orderDetail:orderDetail});
    return;
    }
    res.status(404).json({message:"Order not found",orderDetail:orderDetail});
    }
    catch(err){
     next(err);
    }
 }
 
 async getUserOrderDetail(req:Request,res:Response,next:NextFunction){
   try{
    const userName=req.params.userName as string;
    let orderDetail=await orderService.getOrderDetailService(userName);
    if(!orderDetail){
      res.status(200).json({message:"Orders not found",orderDetail:null});
      return;
    }
    res.status(200).json({message:"User Detail retrieved successfully",orderDetail: orderDetail})
   }
   catch(err){
    next(err);
   }
 }
}

export default new OrderController();