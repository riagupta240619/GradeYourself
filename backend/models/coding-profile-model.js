"use strict";

const mongoose=require("mongoose");
const codingProfileSchema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  platform:{type:String,required:true,enum:["leetcode","geeksforgeeks","codeforces","hackerrank","other"],lowercase:true},
  platformLabel:{type:String,trim:true,default:""},
  username:{type:String,required:true,trim:true,maxlength:100},
  profileUrl:{type:String,required:true,trim:true,maxlength:500},
  stats:{type:mongoose.Schema.Types.Mixed,default:{}},
  lastSyncedAt:{type:Date,default:null}
},{timestamps:true});
codingProfileSchema.index({user:1,platform:1},{unique:true});
module.exports=mongoose.model("CodingProfile",codingProfileSchema);