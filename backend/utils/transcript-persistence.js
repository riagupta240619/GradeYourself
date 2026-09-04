"use strict";
const mongoose=require("mongoose");
const Semester=require("../models/semester-model");
const Subject=require("../models/subject-model");
const User=require("../models/user-model");

async function persistTranscriptAtomically(userId,payload,buildSubjects){
 const session=await mongoose.startSession();
 try{
  const ids=[];
  await session.withTransaction(async()=>{
   const user=await User.findById(userId).session(session);
   if(!user)throw new Error("User not found");
   for(const item of payload.semesters){
    const name=String(item.semesterName||("Semester "+(item.semester||1))).trim();
    let sem=await Semester.findOne({user:userId,name}).session(session);
    const patch={finalizedSgpa:Number.isFinite(Number(item.sgpa))?Number(item.sgpa):null,cgpa:Number.isFinite(Number(item.cgpa))?Number(item.cgpa):null,credits:Number(item.credits)||20,isCurrent:false};
    if(sem){Object.assign(sem,patch);await sem.save({session});}
    else sem=(await Semester.create([{user:userId,name,...patch}],{session}))[0];
    await Subject.deleteMany({user:userId,semester:sem._id}).session(session);
    const docs=buildSubjects(item,sem._id);
    if(docs.length)await Subject.insertMany(docs,{session,ordered:true});
    ids.push(sem._id);
   }
   if(payload.university)user.college=String(payload.university).trim().slice(0,150);
   if(payload.program)user.course=String(payload.program).trim().slice(0,150);
   await user.save({session});
  });
  return ids;
 }finally{await session.endSession();}
}
module.exports={persistTranscriptAtomically};