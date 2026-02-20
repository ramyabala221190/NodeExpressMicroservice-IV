import mongoose from "mongoose";
import { CustomError } from "../app";
import orderModel, { OrderModel, ProductModel } from "../models/orderModel";
import communicatorService from "./communicatorService";

class UserService   {

  constructor(){
    console.log("instance for User Service created")
  }

async getOrderDetailService(userName:string):Promise<OrderModel[]|null>{
    try{
    const userDetail=await communicatorService.fetchUserDetailForUserName(userName);
    const orders= await orderModel.find({user:userDetail._id});
    if(orders.length){
    let productObjectIdList= orders.reduce((acc:mongoose.Types.ObjectId[],curr)=>{
      let idList=curr.products.map(x=>x.id);
      acc=acc.concat(idList);
      return acc;
    },[])
    const productDetail= await communicatorService.fetchProductDetailForObjectId(productObjectIdList);
    return orders.map((orderDetail)=>{
    let productInOrderList= productDetail.filter((product)=>{
      if(orderDetail.products.find(x=>x.id == product._id)){
        return product;
      }
    })
    return {
      _id: orderDetail._id,
      cartId: orderDetail.cartId as mongoose.Types.ObjectId,
      user: userDetail._id,
      status: orderDetail.status,
      totalCost: orderDetail.totalCost as number,
      products: productInOrderList.map(x=>{
        let product=orderDetail.products.find(y=>{ return y.id == x?._id});
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
    catch(err){
       throw new CustomError(`Error fetching order detail:${err}`,500);
    }
}

async updateOrderStatusService(orderId:string):Promise<OrderModel|null>{
  try{
   return orderModel.findOneAndUpdate({
    _id: new mongoose.Types.ObjectId(orderId) //convert the string into ObjectId
   },
   {
    $set:{
      status: "completed"
    }
   },
   {
    new:true
   }
  )
  }
  catch(err){
    throw new CustomError(`Error updating order status:${err}`,500);
  }
}

async createOrderService(orderPayload:OrderModel){
  try{
     return await orderModel.insertOne(orderPayload); 
  }
  catch(err){
           throw new CustomError(`Error creating order:${err}`,500);
  }
}

}

export default new UserService();


