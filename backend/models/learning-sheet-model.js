"use strict";

const mongoose=require("mongoose");
const learningSheetSchema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  title:{type:String,required:true,trim:true,maxlength:200},
  url:{type:String,required:true,trim:true,maxlength:1000},
  source:{type:String,enum:["codolio","tle","external","custom"],default:"external"},
  description:{type:String,trim:true,default:""},
  isBookmarked:{type:Boolean,default:true}
},{timestamps:true});
learningSheetSchema.index({user:1,url:1},{unique:true});
module.exports=mongoose.model("LearningSheet",learningSheetSchema);