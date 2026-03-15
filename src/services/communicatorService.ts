import { ProductModel, UserModel } from "@ramyabala221190/api-contracts";
import axios from "axios";
import { MongooseBulkWriteResult } from "mongoose";

class CommunicatorService{
    constructor(){
        console.log("CommunicatorService instantiated")
    }

   private userUrl: string = `${process.env.API_GATEWAY}:${process.env.API_GATEWAY_PORT}/${process.env.USER_MICROSERVICE_MAPPING}`;
   private productUrl: string = `${process.env.API_GATEWAY}:${process.env.API_GATEWAY_PORT}/${process.env.PRODUCT_MICROSERVICE_MAPPING}`;


    async fetchUserDetailForUserName(username: string): Promise<UserModel> {
      return (await axios.get(`http://${this.userUrl}/user/${username}`)).data.userDetail;
   }

    async fetchProductDetailForObjectId(productObjectIds: string[]): Promise<ProductModel[]> {
      return (await axios.post(`http://${this.productUrl}/products/internal/ids`, { productIds: productObjectIds })).data.product;
   }

   async decrementProductStock(payload:{productId:number,qty:number}[]):Promise<MongooseBulkWriteResult>{
      return (await axios.put(`http://${this.productUrl}/product/stock/`,{productList:payload})).data;
   }

}

export default new CommunicatorService();