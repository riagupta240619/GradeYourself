"use strict";
const Resume=require("../models/resume-model");

function normalizeResumeInput(body){
 const data=body.data||{};
 return {
  personal:data.personal&&typeof data.personal==="object"?data.personal:{},
  education:Array.isArray(data.education)?data.education:[],
  skills:Array.isArray(data.skills)?data.skills.map(String).filter(Boolean):[],
  projects:Array.isArray(data.projects)?data.projects:[],
  experience:Array.isArray(data.experience)?data.experience:[],
  certifications:Array.isArray(data.certifications)?data.certifications:[],
  links:Array.isArray(data.links)?data.links:[]
 };
}
function words(text){return [...new Set(String(text||"").toLowerCase().match(/[a-z][a-z+#.-]{2,}/g)||[])];}
function analyze(resume,jobDescription){
 const data=resume.data||resume;
 const resumeText=JSON.stringify(data);
 const resumeWords=new Set(words(resumeText));
 const jobWords=words(jobDescription);
 const ignored=new Set(["with","and","the","for","that","this","from","your","you","are","our","will","have","has","years","year","work","team","role","job","skills","experience","using"]);
 const keywords=[...new Set(jobWords.filter(w=>!ignored.has(w)))].slice(0,80);
 const matched=keywords.filter(w=>resumeWords.has(w));
 const missing=keywords.filter(w=>!resumeWords.has(w)).slice(0,25);
 const keywordScore=keywords.length?Math.round((matched.length/keywords.length)*100):0;
 const skills=(data.skills||[]).map(s=>String(s).toLowerCase());
 const skillsMatch=skills.length&&keywords.length?Math.round((skills.filter(s=>keywords.some(k=>s.includes(k)||k.includes(s))).length/skills.length)*100):0;
 const sections=["personal","education","skills","projects","experience"].filter(k=>Array.isArray(data[k])?data[k].length>0:Object.keys(data[k]||{}).length>0);
 const structureScore=Math.round((sections.length/5)*100);
 const overall=Math.round(keywordScore*0.5+skillsMatch*0.3+structureScore*0.2);
 const recommendations=[];
 if(!data.skills||data.skills.length===0)recommendations.push("Add a focused skills section using technologies relevant to the job description.");
 if(!data.projects||data.projects.length===0)recommendations.push("Add projects with concrete technologies and outcomes.");
 if(missing.length>0)recommendations.push("Review missing keywords and add only those that truthfully describe your experience.");
 if(structureScore<80)recommendations.push("Complete important resume sections to improve structure and readability.");
 return {overallScore:overall,keywordMatch:keywordScore,skillsMatch,sectionStructure:structureScore,matchedKeywords:matched.slice(0,30),missingKeywords:missing,recommendations,disclaimer:"This is an internal compatibility estimate, not a guarantee of performance in any proprietary applicant tracking system."};
}
async function listResumes(req,res,next){try{const resumes=await Resume.find({user:req.user._id}).sort({updatedAt:-1}).lean();res.json({resumes});}catch(e){next(e);}}
async function createResume(req,res,next){try{const name=String(req.body.name||"Untitled Resume").trim();const resume=await Resume.create({user:req.user._id,name,template:String(req.body.template||"classic"),data:normalizeResumeInput(req.body)});res.status(201).json({resume});}catch(e){next(e);}}
async function getResume(req,res,next){try{const resume=await Resume.findOne({_id:req.params.id,user:req.user._id}).lean();if(!resume){res.status(404);throw new Error("Resume not found");}res.json({resume});}catch(e){next(e);}}
async function updateResume(req,res,next){try{const patch={};if(req.body.name!==undefined)patch.name=String(req.body.name).trim();if(req.body.template!==undefined)patch.template=String(req.body.template);if(req.body.data!==undefined)patch.data=normalizeResumeInput(req.body);const resume=await Resume.findOneAndUpdate({_id:req.params.id,user:req.user._id},patch,{new:true,runValidators:true});if(!resume){res.status(404);throw new Error("Resume not found");}res.json({resume});}catch(e){next(e);}}
async function duplicateResume(req,res,next){try{const source=await Resume.findOne({_id:req.params.id,user:req.user._id});if(!source){res.status(404);throw new Error("Resume not found");}const copy=await Resume.create({user:req.user._id,name:(source.name+" Copy").slice(0,150),template:source.template,data:source.data,versionNumber:source.versionNumber+1,parentResume:source._id});res.status(201).json({resume:copy});}catch(e){next(e);}}
async function deleteResume(req,res,next){try{const result=await Resume.deleteOne({_id:req.params.id,user:req.user._id});if(!result.deletedCount){res.status(404);throw new Error("Resume not found");}res.json({message:"Resume deleted"});}catch(e){next(e);}}
async function atsAnalysis(req,res,next){try{const jobDescription=String(req.body.jobDescription||"").trim();if(!jobDescription){res.status(400);throw new Error("Job description is required");}let resume;if(req.body.resumeId){resume=await Resume.findOne({_id:req.body.resumeId,user:req.user._id});if(!resume){res.status(404);throw new Error("Resume not found");}}else{resume={data:normalizeResumeInput(req.body)};}res.json({analysis:analyze(resume,jobDescription)});}catch(e){next(e);}}
function escapeLatex(value){return String(value||"").replace(/([#$%&_{}])/g,"\\$1").replace(/\\/g,"\\textbackslash{}");}
async function latexExport(req,res,next){try{const resume=await Resume.findOne({_id:req.params.id,user:req.user._id});if(!resume){res.status(404);throw new Error("Resume not found");}const d=resume.data||{};const lines=["\\documentclass[11pt]{article}","\\usepackage[margin=0.7in]{geometry}","\\begin{document}","\\begin{center}","{\\LARGE "+escapeLatex(d.personal?.name||resume.name)+"}\\\\","\\end{center}"];if((d.skills||[]).length)lines.push("\\section*{Skills}",escapeLatex(d.skills.join(", ")));if((d.projects||[]).length){lines.push("\\section*{Projects}");for(const p of d.projects)lines.push("\\textbf{"+escapeLatex(p.name||p.title||"Project")+"} "+escapeLatex(p.description||"")+"\\\\");}lines.push("\\end{document}");res.json({latex:lines.join("\n"),workflow:"User-controlled export. Open the generated LaTeX in Overleaf using its supported import/open workflow."});}catch(e){next(e);}}
module.exports={listResumes,createResume,getResume,updateResume,duplicateResume,deleteResume,atsAnalysis,latexExport};