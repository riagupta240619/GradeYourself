"use strict";

const mongoose=require("mongoose");
const resourceBookmarkSchema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  title:{type:String,required:true,trim:true,maxlength:200},
  url:{type:String,required:true,trim:true,maxlength:1000},
  category:{type:String,trim:true,default:"General"},
  source:{type:String,trim:true,default:"external"},
  notes:{type:String,trim:true,default:""}
},{timestamps:true});
resourceBookmarkSchema.index({user:1,url:1},{unique:true});
module.exports=mongoose.model("ResourceBookmark",resourceBookmarkSchema);