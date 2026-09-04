const mongoose=require("mongoose");
const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  collectionId:{type:String,required:true,index:true},
  itemId:{type:String,required:true},
  done:{type:Boolean,default:false}
},{timestamps:true});
schema.index({user:1,collectionId:1,itemId:1},{unique:true});
module.exports=mongoose.model("LearningSheetProgress",schema);