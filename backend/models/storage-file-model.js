"use strict";

const mongoose=require("mongoose");
const storageFileSchema=new mongoose.Schema({
 user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
 name:{type:String,required:true,trim:true,maxlength:255},
 originalName:{type:String,required:true,trim:true,maxlength:255},
 mimeType:{type:String,required:true},
 size:{type:Number,required:true,min:0},
 storageKey:{type:String,required:true},
 provider:{type:String,default:"cloudinary"},
 providerUrl:{type:String,required:true,select:false},
 folder:{type:mongoose.Schema.Types.ObjectId,ref:"StorageFolder",default:null,index:true},
 isFavorite:{type:Boolean,default:false,index:true},
 isDeleted:{type:Boolean,default:false,index:true},
 deletedAt:{type:Date,default:null},
 lastOpenedAt:{type:Date,default:null}
},{timestamps:true});
storageFileSchema.index({user:1,isDeleted:1,folder:1,updatedAt:-1});
module.exports=mongoose.model("StorageFile",storageFileSchema);