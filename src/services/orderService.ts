import mongoose from "mongoose";
import { CustomError, ExplicitError } from "../app";
import orderModel, { OrderDocument } from "../models/orderModel";
import communicatorService from "./communicatorService";
import { OrderPayload, OrderResponse, ProductModel } from "@ramyabala221190/api-contracts";

class UserService   {

  constructor(){
    console.log("instance for User Service created")
  }

async getOrderDetailService(userName:string):Promise<OrderResponse[]>{
    try{
    if(userName){
    const userDetail=await communicatorService.fetchUserDetailForUserName(userName);
    const orders:OrderDocument[]= await orderModel.find({user:userDetail._id});
    if(orders.length){
    let productObjectIdList= orders.reduce((acc:string[],curr)=>{
      let idList=curr.products.map(x=>x.id.toString());
      acc=acc.concat(idList);
      return acc;
    },[]);
    console.log(productObjectIdList);
    const productDetail= await communicatorService.fetchProductDetailForObjectId(productObjectIdList);
    return orders.map((orderDetail)=>{
    let productInOrderList= productDetail.filter((product)=>{
      if(orderDetail.products.find(x=>x.id.toString() == product._id)){
        return product;
      }
    })
    return {
      _id: orderDetail._id.toString(),
      cartId: orderDetail.cartId.toString(),
      user: userDetail._id,
      status: orderDetail.status,
      totalCost: orderDetail.totalCost as number,
      products: productInOrderList.map(x=>{
        let product=orderDetail.products.find(y=>{ return y.id.toString() == x._id});
        return {
          product: x as ProductModel,
          qty: product?.qty as number ,
          price: x?.price as number
        }
      })

    }
    })
    }
    else{
      return [];
    }
  }
  else{
    throw new ExplicitError("Username not valid",400);
  }
    }
    catch(err){
      console.log(err);
      if(err instanceof ExplicitError){
        throw err;
      }
       throw new CustomError(`Error fetching order detail:${err}`,500);
    }
}

async updateOrderStatusService(payload:{orderId:string,productList:{productId:number,qty:number}[]}):Promise<void>{
  let session!:mongoose.ClientSession;
  try{
   session = await mongoose.startSession();
   session.startTransaction();
   await communicatorService.decrementProductStock(payload.productList);
   const updatedOrder: OrderDocument|null=await orderModel.findOneAndUpdate(
   {
    _id: new mongoose.Types.ObjectId(payload.orderId) //convert the string into ObjectId
   },
   {
    $set:{
      status: "completed"
    }
   },
   {
    new:true, //returns updated doc and not the old one
    runValidators:true
   }
  )
  if(updatedOrder == null){
    throw new ExplicitError("Order not found",404);
  }
  await session.commitTransaction();
  }
  catch(err){
    session?.abortTransaction();
    if(err instanceof ExplicitError){
      throw err;
    }
    else{
    throw new CustomError(`Error updating order status:${err}`,500);
    }
  }
  finally{
    session?.endSession();
  }
}

async createOrderService(orderPayload:OrderPayload):Promise<void>{
  try{
     await orderModel.create(orderPayload); 
  }
  catch(err){
      throw new CustomError(`Error creating order:${err}`,500);
  }
}

}

export default new UserService();


