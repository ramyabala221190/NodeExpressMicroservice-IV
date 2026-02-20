import axios from "axios";
import { ProductModel, UserModel } from "../models/orderModel";
import mongoose from "mongoose";

class CommunicatorService{
    constructor(){
        console.log("CommunicatorService instantiated")
    }

   private userUrl: string = `${process.env.API_GATEWAY}:${process.env.API_GATEWAY_PORT}/${process.env.USER_MICROSERVICE_MAPPING}`;
   private productUrl: string = `${process.env.API_GATEWAY}:${process.env.API_GATEWAY_PORT}/${process.env.PRODUCT_MICROSERVICE_MAPPING}`;


    async fetchUserDetailForUserName(username: string): Promise<UserModel> {
      return (await axios.get(`http://${this.userUrl}/user/${username}`)).data.userDetail;
   }

    async fetchProductDetailForObjectId(productObjectIds: mongoose.Types.ObjectId[]): Promise<ProductModel[]> {
      return (await axios.post(`http://${this.productUrl}/products/internal/ids`, { productIds: productObjectIds })).data.product;
   }

}

export default new CommunicatorService();