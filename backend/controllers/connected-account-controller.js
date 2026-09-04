"use strict";

const ConnectedAccount=require("../models/connected-account-model");
const CodingProfile=require("../models/coding-profile-model");

const PLATFORM_RULES={
  leetcode:{host:"leetcode.com",prefix:"https://leetcode.com/u/"},
  geeksforgeeks:{host:"geeksforgeeks.org",prefix:"https://www.geeksforgeeks.org/user/"},
  codeforces:{host:"codeforces.com",prefix:"https://codeforces.com/profile/"},
  hackerrank:{host:"hackerrank.com",prefix:"https://www.hackerrank.com/profile/"},
  codolio:{host:"codolio.com",prefix:"https://codolio.com/profile/"},
  github:{host:"github.com",prefix:"https://github.com/"}
};

function cleanPlatform(value){
 const platform=String(value||"").toLowerCase().replace(/\s+/g,"");
 if(!PLATFORM_RULES[platform]) throw Object.assign(new Error("Unsupported platform"),{statusCode:400});
 return platform;
}
function validateUrl(url){
 const parsed=new URL(url);
 if(parsed.protocol!=="https:") throw new Error("Profile URL must use HTTPS");
 return parsed;
}
function buildProfileUrl(platform,username,provided){
 if(provided){validateUrl(provided);return provided;}
 if(!username) throw Object.assign(new Error("Username or profile URL is required"),{statusCode:400});
 return PLATFORM_RULES[platform].prefix+encodeURIComponent(username);
}

async function listAccounts(req,res,next){
 try{const accounts=await ConnectedAccount.find({user:req.user._id}).sort({platform:1}).lean();res.json({accounts});}catch(e){next(e);}
}
async function upsertAccount(req,res,next){
 try{
  const platform=cleanPlatform(req.body.platform);
  const username=String(req.body.username||"").trim();
  const profileUrl=buildProfileUrl(platform,username,req.body.profileUrl);
  const connectionType=req.body.connectionType==="oauth"?"oauth":req.body.connectionType==="api"?"api":"profile_link";
  const account=await ConnectedAccount.findOneAndUpdate({user:req.user._id,platform},{username,profileUrl,connectionType,status:"connected"},{new:true,upsert:true,setDefaultsOnInsert:true,runValidators:true});
  res.status(201).json({account});
 }catch(e){if(e.statusCode) res.status(e.statusCode);next(e);}
}
async function removeAccount(req,res,next){
 try{
  const account=await ConnectedAccount.findOneAndDelete({_id:req.params.id,user:req.user._id});
  if(!account){res.status(404);throw new Error("Connected account not found");}
  await CodingProfile.deleteOne({user:req.user._id,platform:account.platform});
  res.json({message:"Account disconnected"});
 }catch(e){next(e);}
}

async function listCodingProfiles(req,res,next){
 try{const profiles=await CodingProfile.find({user:req.user._id}).sort({platform:1}).lean();res.json({profiles});}catch(e){next(e);}
}
async function saveCodingProfile(req,res,next){
 try{
  const requestedPlatform=String(req.body.platform||"").toLowerCase().trim();
  const supported=["leetcode","geeksforgeeks","codeforces","hackerrank","other"];
  if(!supported.includes(requestedPlatform)){res.status(400);throw new Error("Unsupported coding platform");}
  const platform=requestedPlatform;
  const username=String(req.body.username||"").trim();
  if(!username){res.status(400);throw new Error("Username is required");}
  if(username.length>100){res.status(400);throw new Error("Username cannot exceed 100 characters");}
  const urlPlatform=platform==="other"?"leetcode":platform;
  const profileUrl=buildProfileUrl(urlPlatform,username,req.body.profileUrl);
  const accountPlatform=urlPlatform;
  const existingAccount=await ConnectedAccount.findOne({user:req.user._id,platform:accountPlatform});
  const account=await ConnectedAccount.findOneAndUpdate(
    {user:req.user._id,platform:accountPlatform},
    {$set:{username,profileUrl,connectionType:"profile_link",status:"connected"}},
    {upsert:true,new:true,setDefaultsOnInsert:true,runValidators:true}
  );
  try{
    const profile=await CodingProfile.findOneAndUpdate(
      {user:req.user._id,platform},
      {$set:{username,profileUrl,platformLabel:String(req.body.platformLabel||"").trim()}},
      {new:true,upsert:true,setDefaultsOnInsert:true,runValidators:true}
    );
    res.status(201).json({profile});
  }catch(profileError){
    if(existingAccount){
      await ConnectedAccount.findByIdAndUpdate(existingAccount._id,{username:existingAccount.username,profileUrl:existingAccount.profileUrl,connectionType:existingAccount.connectionType,status:existingAccount.status});
    }else{
      await ConnectedAccount.findByIdAndDelete(account._id);
    }
    throw profileError;
  }
 }catch(e){next(e);}
}
async function deleteCodingProfile(req,res,next){
 try{
  const profile=await CodingProfile.findOneAndDelete({_id:req.params.id,user:req.user._id});
  if(!profile){res.status(404);throw new Error("Coding profile not found");}
  res.json({message:"Coding profile removed"});
 }catch(e){next(e);}
}
async function syncCodingProfile(req,res,next){
 try{
  const profile=await CodingProfile.findOne({_id:req.params.id,user:req.user._id});
  if(!profile){res.status(404);throw new Error("Coding profile not found");}
  if(profile.platform!=="codeforces"){
    return res.json({profile,warning:"No official supported public statistics API is configured for this platform. Profile link is preserved without scraping."});
  }
  const response=await fetch("https://codeforces.com/api/user.info?handles="+encodeURIComponent(profile.username));
  const payload=await response.json();
  if(!response.ok||payload.status!=="OK"){res.status(502);throw new Error("Codeforces statistics could not be fetched");}
  const user=payload.result[0];
  profile.stats={rating:user.rating||null,maxRating:user.maxRating||null,rank:user.rank||null,maxRank:user.maxRank||null,contribution:user.contribution||0,friendOfCount:user.friendOfCount||0};
  profile.lastSyncedAt=new Date();
  await profile.save();
  res.json({profile});
 }catch(e){next(e);}
}
module.exports={listAccounts,upsertAccount,removeAccount,listCodingProfiles,saveCodingProfile,deleteCodingProfile,syncCodingProfile};