"use strict";
const LearningSheet=require("../models/learning-sheet-model");
const LearningSheetProgress=require("../models/learning-sheet-progress-model");

const CACHE_MS=10*60*1000;
let providerCache={value:null,expires:0};

const BASE_COLLECTIONS=[];

function safeUrl(value){const u=new URL(String(value||""));if(u.protocol!=="https:")throw new Error("Sheet URL must use HTTPS");return u.toString();}
function cleanItem(item,index){
  if(!item||typeof item!=="object")return null;
  const title=String(item.title||item.name||item.problemName||"Question "+(index+1)).trim();
  const url=item.url||item.link||item.problemUrl||"";
  if(!url)return null;
  let safe;try{safe=safeUrl(url);}catch{return null;}
  return {id:String(item.id||item.slug||safe),title,url:safe,platform:String(item.platform||item.source||"External"),difficulty:String(item.difficulty||item.rating||""),topic:String(item.topic||item.category||""),description:String(item.description||"").trim()};
}
function cleanCollection(raw,provider,index){
  if(!raw||typeof raw!=="object")return null;
  const title=String(raw.title||raw.name||raw.sheetName||"Untitled sheet").trim();
  const sourceUrl=raw.sourceUrl||raw.url||raw.link||"";
  let safe="";try{if(sourceUrl)safe=safeUrl(sourceUrl);}catch{}
  const items=(raw.items||raw.questions||raw.problems||[]).map(cleanItem).filter(Boolean);
  if(items.length===0)return null;
  return {id:String(raw.id||raw.slug||(provider+"-"+index+"-"+title.toLowerCase().replace(/[^a-z0-9]+/g,"-"))),provider,title,category:String(raw.category||raw.type||"General"),description:String(raw.description||"").trim(),sourceUrl:safe,items};
}
async function fetchProvider(url,provider){
  if(!url)return null;
  const response=await fetch(url,{headers:{accept:"application/json"},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error(provider+" catalog request failed");
  const data=await response.json();
  const list=Array.isArray(data)?data:(data.sheets||data.collections||data.data||[]);
  if(!Array.isArray(list))throw new Error(provider+" catalog format is unsupported");
  return list.map((x,i)=>cleanCollection(x,provider,i)).filter(Boolean);
}
async function providerCatalog(){
  if(providerCache.value&&providerCache.expires>Date.now())return providerCache.value;
  const result={collections:BASE_COLLECTIONS.map(x=>({...x,items:[...x.items]})),sources:{codolio:"metadata",tle:"metadata"},updatedAt:new Date().toISOString()};
  const tasks=[
    ["codolio",process.env.CODOLIO_SHEETS_API_URL],
    ["tle",process.env.TLE_SHEETS_API_URL]
  ];
  for(const [provider,url] of tasks){
    if(!url)continue;
    try{
      const collections=await fetchProvider(url,provider);
      result.collections=result.collections.filter(x=>x.provider!==provider).concat(collections||[]);
      result.sources[provider]="synced";
    }catch{result.sources[provider]="unavailable";}
  }
  providerCache={value:result,expires:Date.now()+CACHE_MS};
  return result;
}
async function listCatalog(req,res,next){try{res.json(await providerCatalog());}catch(e){next(e);}}
async function syncCatalog(req,res,next){try{providerCache={value:null,expires:0};res.json(await providerCatalog());}catch(e){next(e);}}
async function listSheets(req,res,next){try{const sheets=await LearningSheet.find({user:req.user._id}).sort({updatedAt:-1}).lean();res.json({sheets});}catch(e){next(e);}}
async function createSheet(req,res,next){try{
  const title=String(req.body.title||"").trim();if(!title){res.status(400);throw new Error("Sheet title is required");}
  const url=safeUrl(req.body.url);
  const source=["codolio","tle","external","custom"].includes(req.body.source)?req.body.source:"external";
  const sheet=await LearningSheet.findOneAndUpdate({user:req.user._id,url},{title,url,source,description:String(req.body.description||"").trim(),isBookmarked:req.body.isBookmarked!==false},{new:true,upsert:true,setDefaultsOnInsert:true,runValidators:true});
  res.status(201).json({sheet});
}catch(e){next(e);}}
async function updateSheet(req,res,next){try{
  const patch={};if(req.body.title!==undefined)patch.title=String(req.body.title).trim();if(req.body.url!==undefined)patch.url=safeUrl(req.body.url);if(req.body.description!==undefined)patch.description=String(req.body.description).trim();if(req.body.isBookmarked!==undefined)patch.isBookmarked=Boolean(req.body.isBookmarked);
  const sheet=await LearningSheet.findOneAndUpdate({_id:req.params.id,user:req.user._id},patch,{new:true,runValidators:true});if(!sheet){res.status(404);throw new Error("Sheet not found");}res.json({sheet});
}catch(e){next(e);}}
async function deleteSheet(req,res,next){try{const sheet=await LearningSheet.findOneAndDelete({_id:req.params.id,user:req.user._id});if(!sheet){res.status(404);throw new Error("Sheet not found");}res.json({message:"Sheet removed"});}catch(e){next(e);}}
async function listProgress(req,res,next){try{
  const progress=await LearningSheetProgress.find({user:req.user._id}).lean();
  res.json({progress:progress.map(x=>({collectionId:x.collectionId,itemId:x.itemId,done:x.done,updatedAt:x.updatedAt}))});
}catch(e){next(e);}}
async function setProgress(req,res,next){try{
  const collectionId=String(req.params.collectionId||"").trim(),itemId=String(req.params.itemId||"").trim();
  if(!collectionId||!itemId){res.status(400);throw new Error("Collection and item are required");}
  const progress=await LearningSheetProgress.findOneAndUpdate({user:req.user._id,collectionId,itemId},{done:Boolean(req.body.done)},{new:true,upsert:true,setDefaultsOnInsert:true});
  res.json({progress:{collectionId:progress.collectionId,itemId:progress.itemId,done:progress.done,updatedAt:progress.updatedAt}});
}catch(e){next(e);}}
module.exports={listCatalog,syncCatalog,listSheets,createSheet,updateSheet,deleteSheet,listProgress,setProgress};