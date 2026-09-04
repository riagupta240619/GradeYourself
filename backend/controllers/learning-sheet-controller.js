"use strict";
const LearningSheet=require("../models/learning-sheet-model");

const PUBLIC_SHEETS=[
  {
    id:"codolio-explore",
    provider:"codolio",
    title:"Codolio Explore Sheets",
    category:"Explore",
    description:"Browse Codolio's public sheet library, including popular, topic-wise, competitive-programming and quick-revision collections.",
    url:"https://codolio.com/question-tracker",
    externalOnly:true
  },
  {
    id:"codolio-popular",
    provider:"codolio",
    title:"Codolio Popular Sheets",
    category:"Popular",
    description:"A discovery entry point for widely used community sheets such as interview and DSA preparation lists.",
    url:"https://codolio.com/question-tracker",
    externalOnly:true
  },
  {
    id:"codolio-mastery",
    provider:"codolio",
    title:"Codolio Mastery Sheets",
    category:"Topic-wise",
    description:"Topic-focused learning paths for patterns such as dynamic programming and graphs.",
    url:"https://codolio.com/question-tracker",
    externalOnly:true
  },
  {
    id:"codolio-cp",
    provider:"codolio",
    title:"Codolio Competitive Programming",
    category:"Competitive Programming",
    description:"Use Codolio's Explore Sheets area to find competitive-programming collections, including CP-31.",
    url:"https://codolio.com/question-tracker",
    externalOnly:true
  },
  {
    id:"tle-cp31",
    provider:"tle",
    title:"TLE Eliminators CP-31",
    category:"Competitive Programming",
    description:"Official CP-31 collection with 31 hand-picked Codeforces problems per rating, spanning 800 to 1900.",
    url:"https://www.tle-eliminators.com/cp-sheet",
    externalOnly:false,
    ratings:[800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900]
  },
  {
    id:"codolio-cp31-1000",
    provider:"codolio",
    title:"Codolio CP-31 (1000 rated)",
    category:"Competitive Programming",
    description:"Public Codolio sheet entry for the 1000-rated CP-31 collection.",
    url:"https://codolio.com/question-tracker/sheet/1000-rated-cp-31-sheet",
    externalOnly:true
  }
];

function safeUrl(value){const u=new URL(String(value||""));if(u.protocol!=="https:")throw new Error("Sheet URL must use HTTPS");return u.toString();}

async function listCatalog(req,res,next){
  try{
    res.json({
      providers:[
        {id:"codolio",name:"Codolio",description:"Popular, topic-wise, competitive-programming and revision sheets."},
        {id:"tle",name:"TLE Eliminators",description:"Competitive-programming practice sheets, including CP-31."}
      ],
      sheets:PUBLIC_SHEETS
    });
  }catch(e){next(e);}
}

async function listSheets(req,res,next){try{const sheets=await LearningSheet.find({user:req.user._id}).sort({updatedAt:-1}).lean();res.json({sheets});}catch(e){next(e);}}
async function createSheet(req,res,next){try{
  const title=String(req.body.title||"").trim();
  if(!title){res.status(400);throw new Error("Sheet title is required");}
  const url=safeUrl(req.body.url);
  const source=["codolio","tle","external","custom"].includes(req.body.source)?req.body.source:"external";
  const sheet=await LearningSheet.findOneAndUpdate(
    {user:req.user._id,url},
    {title,url,source,description:String(req.body.description||"").trim(),isBookmarked:req.body.isBookmarked!==false},
    {new:true,upsert:true,setDefaultsOnInsert:true,runValidators:true}
  );
  res.status(201).json({sheet});
}catch(e){next(e);}}
async function updateSheet(req,res,next){try{
  const patch={};
  if(req.body.title!==undefined)patch.title=String(req.body.title).trim();
  if(req.body.url!==undefined)patch.url=safeUrl(req.body.url);
  if(req.body.description!==undefined)patch.description=String(req.body.description).trim();
  if(req.body.isBookmarked!==undefined)patch.isBookmarked=Boolean(req.body.isBookmarked);
  const sheet=await LearningSheet.findOneAndUpdate({_id:req.params.id,user:req.user._id},patch,{new:true,runValidators:true});
  if(!sheet){res.status(404);throw new Error("Sheet not found");}
  res.json({sheet});
}catch(e){next(e);}}
async function deleteSheet(req,res,next){try{const sheet=await LearningSheet.findOneAndDelete({_id:req.params.id,user:req.user._id});if(!sheet){res.status(404);throw new Error("Sheet not found");}res.json({message:"Sheet removed"});}catch(e){next(e);}}
module.exports={listCatalog,listSheets,createSheet,updateSheet,deleteSheet};