import mongoose, { mongo, Mongoose } from "mongoose";

export interface UserModel{
  _id:mongoose.Types.ObjectId,
  id: number,
    name: string,
    username: string,
    email: string,
    address: {
      street: string,
      suite: string,
      city: string,
      zipcode: string,
      geo: {
        lat: string,
        lng: string
      }
    },
    phone: string,
    website: string,
    company: {
      name:string,
      catchPhrase: string,
      bs: string
    }
}

export interface ProductModel {
    _id: mongoose.Types.ObjectId,
    id:number,
    title: string,
    description: string,
    category: string,
    price: number,
    discountPercentage: number,
    rating: number,
    stock: number,
    tags: string[],
    brand: string,
    sku: string,
    weight: number,
    dimensions: {
        width: number,
        height: number,
        depth: number
    },
    warrantyInformation: string,
    shippingInformation: string,
    availabilityStatus: string,
    reviews: {
        rating: number,
        comment: string,
        date: Date,
        reviewerName: string,
        reviewerEmail: string
    }[],
    returnPolicy: string,
    minimumOrderQuantity: number,
    meta: {
        createdAt: Date,
        updatedAt: Date,
        barcode: string,
        qrCode: string
    },
    images: string[],
    thumbnail: string
}

export interface OrderModel{
  _id: mongoose.Types.ObjectId,
  cartId: mongoose.Types.ObjectId,
  user: mongoose.Types.ObjectId,
  status:string|null|undefined,
  totalCost:number,
  products:{
    product: ProductModel,
    qty:number,
    price:number
  }[]
}

const productOrderSchema= new mongoose.Schema({
  id: mongoose.Schema.ObjectId,
  qty: Number,
  price:Number
})

const orderSchema= new mongoose.Schema({
   cartId:mongoose.Schema.ObjectId,
   user: mongoose.Schema.ObjectId,
   totalCost: Number,
   status:String,
   products: [productOrderSchema]
},
{timestamps:true})

export default mongoose.model("order",orderSchema); //collection name will be carts i.e plural lowercase of model name