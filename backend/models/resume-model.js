"use strict";

const mongoose=require("mongoose");
const linkSchema=new mongoose.Schema({label:String,url:String},{_id:false});
const resumeSchema=new mongoose.Schema({
 user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
 name:{type:String,required:true,trim:true,maxlength:150},
 domain:{
   type:String,
   enum:["cybersecurity","fullstack","ai_ml","devops_cloud","mobile","sde","other"],
   default:"fullstack",
   index:true
 },
 targetRole:{type:String,trim:true,default:""},
 overleafUrl:{type:String,trim:true,default:""},
 rawText:{type:String,default:""},
 template:{type:String,default:"classic"},
 isDefault:{type:Boolean,default:false},
 data:{
   personal:{type:mongoose.Schema.Types.Mixed,default:{}},
   education:{type:[mongoose.Schema.Types.Mixed],default:[]},
   skills:{type:[String],default:[]},
   projects:{type:[mongoose.Schema.Types.Mixed],default:[]},
   experience:{type:[mongoose.Schema.Types.Mixed],default:[]},
   certifications:{type:[mongoose.Schema.Types.Mixed],default:[]},
   links:{type:[linkSchema],default:[]}
 },
 atsHistory:{type:[mongoose.Schema.Types.Mixed],default:[]},
 versionNumber:{type:Number,default:1},
 parentResume:{type:mongoose.Schema.Types.ObjectId,ref:"Resume",default:null}
},{timestamps:true});
resumeSchema.index({user:1,domain:1,updatedAt:-1});
module.exports=mongoose.model("Resume",resumeSchema);