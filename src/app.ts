import express from 'express';
import { NextFunction, Request, Response } from "express";
import { connectToDb } from './services/dbConnectionService';
import { join } from 'path';
import morganMiddleWare from './logger/morganLogger';
import winstonLogger from './logger/winstonLogger';
import userRouter from './routes/orderRoute';
import swaggerUI from 'swagger-ui-express';
import { readFileSync } from 'fs';

//custom error class for creating custom error messages
export class CustomError extends Error{
    statusCode:number=0;
    constructor(message:string,statusCode:number){
      super(message);
      this.statusCode=statusCode;
    }
}

export class ExplicitError extends CustomError{}

const app=express();

if (process.env.APP_ENV !== "prod") {
  //we dont swagger in prod
  const orderJSONPath=join(`${process.cwd()}`,'bundled-order.json');
  const orderJSON= readFileSync(orderJSONPath,{encoding:'utf8'});
  app.use(
    '/api-docs',
    swaggerUI.serve,
    swaggerUI.setup(JSON.parse(orderJSON), { explorer: true, swaggerOptions: {
    supportedSubmitMethods: ['get'] // Disables the "Execute" button for POST, PUT, DELETE
  } })
  )
}

app.use(morganMiddleWare);

app.use(express.json());

app.use(express.static(join(`${process.cwd()}`,'src','public')))

app.use((req:Request,res:Response,next:NextFunction)=>{
  winstonLogger.info(`Received a request on ${req.protocol}://${req.headers.host}${req.originalUrl}`);
  next();
})

connectToDb();

app.use('/myorder',userRouter);

app.use((req,res,next)=>{
  next(new CustomError("Path not found",404));
})

app.use((error:CustomError,req:Request,res:Response,next:NextFunction)=>{
    const statusCode= error.statusCode ? error.statusCode : 500;
    const message= error.message ? error.message : "Internal server error";
    winstonLogger.error(
      message,{
        error:error,
        stacktrace:error.stack
      }
    )
    res.status(statusCode).json({message: message ,status: statusCode})
  })

  
app.listen(process.env.APP_HTTP_PORT,()=>{
     winstonLogger.debug(`Server listening on port ${process.env.APP_HTTP_PORT}`)
})