"use strict";

const mongoose=require("mongoose");
const storageFolderSchema=new mongoose.Schema({
 user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
 name:{type:String,required:true,trim:true,maxlength:120},
 parentFolder:{type:mongoose.Schema.Types.ObjectId,ref:"StorageFolder",default:null,index:true},
 isDeleted:{type:Boolean,default:false,index:true},
 deletedAt:{type:Date,default:null}
},{timestamps:true});
storageFolderSchema.index({user:1,parentFolder:1,name:1,isDeleted:1},{unique:true});
module.exports=mongoose.model("StorageFolder",storageFolderSchema);