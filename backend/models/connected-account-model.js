"use strict";

const mongoose = require("mongoose");

const connectedAccountSchema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  platform:{type:String,required:true,enum:["leetcode","geeksforgeeks","codeforces","hackerrank","codolio","github"],lowercase:true},
  username:{type:String,trim:true,default:""},
  profileUrl:{type:String,trim:true,default:""},
  connectionType:{type:String,enum:["profile_link","oauth","api"],default:"profile_link"},
  status:{type:String,enum:["connected","needs_reauth","error"],default:"connected"},
  metadata:{type:mongoose.Schema.Types.Mixed,default:{}},
  oauth:{token:{type:String,select:false},refreshToken:{type:String,select:false},expiresAt:{type:Date,default:null}},
  lastSyncedAt:{type:Date,default:null}
},{timestamps:true});
connectedAccountSchema.index({user:1,platform:1},{unique:true});
module.exports=mongoose.model("ConnectedAccount",connectedAccountSchema);