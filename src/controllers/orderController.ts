import { NextFunction, Request, Response } from "express";
import orderService from "../services/orderService";

class OrderController{

 constructor(){
    console.log("OrderController instantiated")
 } 

 async createOrder(req:Request,res:Response,next:NextFunction){
   try{
    await orderService.createOrderService(req.body.orderPayload);
    res.status(200).json({message:"Order created successfully"});
   }
   catch(err){
    next(err);
   }
 }

 async updateOrderStatus(req:Request,res:Response,next:NextFunction){
    try{
    await orderService.updateOrderStatusService(req.body.detail);
    res.status(200).json({message:"Order completed successfully"});
    }
    catch(err){
     next(err);
    }
 }
 
 async getUserOrderDetail(req:Request,res:Response,next:NextFunction){
   try{
    const userName:string=req.params.userName as string;
    let orderDetail=await orderService.getOrderDetailService(userName);
    res.status(200).json({message:"User Detail retrieved successfully",orderDetail: orderDetail})
    }
   catch(err){
    next(err);
   }
 }
}

export default new OrderController();