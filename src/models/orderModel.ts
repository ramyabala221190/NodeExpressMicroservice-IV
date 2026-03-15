import mongoose from "mongoose";

/**
 *  {
    _id: ObjectId('69a6d074d463a6a65d624765'),
    cartId: ObjectId('69a6d05872c5ca06afc23278'),
    user: ObjectId('6970d9378021a075c70d87e9'),
    totalCost: 1599.98,
    status: 'pending',
    products: [
      {
        id: ObjectId('69a6979097e68cffde1aa27f'),
        qty: 2,
        price: 799.99,
        _id: ObjectId('69a6d074d463a6a65d624766')
      }
    ],
    createdAt: ISODate('2026-03-03T12:13:40.328Z'),
    updatedAt: ISODate('2026-03-03T12:13:40.328Z'),
    __v: 0
  }
 */


  //interface that models the schema
export interface OrderDocument extends Document {
  _id: mongoose.Types.ObjectId,
  cartId: mongoose.Types.ObjectId,
  user:mongoose.Types.ObjectId,
  totalCost: number,
  status: string,
  products: {
    _id: mongoose.Types.ObjectId, //objectid of the current subdocument
    id: mongoose.Types.ObjectId,// objectId of the product from products collection
    qty: Number,
    price: Number
  }[]
}

// id will be _id of the product from the products collection
// _id will be added automatically to identify each product in the products subdocument
const productOrderSchema = new mongoose.Schema({
  id: {type:mongoose.Schema.ObjectId,required:true},
  qty: {type:Number,required:true},
  price: {type:Number,required:true}
})

const orderSchema = new mongoose.Schema({
  cartId: {type:mongoose.Schema.ObjectId,required:true},
  user: {type:mongoose.Schema.ObjectId,required:true},
  totalCost: {type:Number,required:true},
  status: {type:String,required:true},
  products: [productOrderSchema]
},
  { timestamps: true });


export default mongoose.model<OrderDocument>("order", orderSchema); //collection name will be carts i.e plural lowercase of model name