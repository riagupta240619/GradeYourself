"use strict";
const ResourceBookmark=require("../models/resource-bookmark-model");

const LETS_HELP="https://www.letshelp.co.in";
const GFG="https://www.geeksforgeeks.org";

const SUBJECTS=[
  {
    id:"dsa",title:"DSA",description:"Data structures, algorithms, problem solving, and practice roadmaps.",
    resources:[
      {id:"dsa-gfg",title:"DSA Tutorial",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/dsa/dsa-tutorial-learn-data-structures-and-algorithms/",description:"Structured DSA topics and practice guidance.",embed:false},
      {id:"dsa-letshelp",title:"DSA Roadmaps & Learning Hub",provider:"Let's Help Everyone",url:`${LETS_HELP}/learninghub`,description:"Public learning hub directory for roadmaps and curated guides.",embed:true}
    ]
  },
  {
    id:"dbms",title:"DBMS",description:"Database fundamentals, ER models, normalization, SQL, indexing, and transactions.",
    resources:[
      {id:"dbms-gfg",title:"DBMS Tutorial",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/dbms/dbms/",description:"Topic-wise DBMS tutorial and practice links.",embed:false},
      {id:"dbms-letshelp",title:"Academic Resource Directory",provider:"Let's Help Everyone",url:`${LETS_HELP}/year/CSE-2nd`,description:"Public academic directory containing second-year subjects and materials.",embed:true}
    ]
  },
  {
    id:"operating-systems",title:"Operating Systems",description:"Processes, scheduling, synchronization, deadlocks, memory, and file systems.",
    resources:[
      {id:"os-gfg",title:"Operating System Tutorial",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/operating-systems/operating-systems/",description:"Structured operating-systems tutorial.",embed:false},
      {id:"os-letshelp",title:"Academic Resource Directory",provider:"Let's Help Everyone",url:`${LETS_HELP}/year/CSE-2nd`,description:"Public academic directory for subject materials.",embed:true}
    ]
  },
  {
    id:"computer-networks",title:"Computer Networks",description:"Network models, routing, transport protocols, and application-layer concepts.",
    resources:[
      {id:"cn-gfg",title:"Computer Networks",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/computer-networks/",description:"Computer-networking tutorials and topic guides.",embed:false},
      {id:"cn-letshelp",title:"Academic Resource Directory",provider:"Let's Help Everyone",url:`${LETS_HELP}/year/CSE-2nd`,description:"Public academic directory for subject materials.",embed:true}
    ]
  },
  {
    id:"oop",title:"OOP",description:"Classes, objects, encapsulation, inheritance, polymorphism, and abstraction.",
    resources:[
      {id:"oop-gfg",title:"Object Oriented Programming Tutorial",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/object-oriented-programming-oop-tutorial/",description:"Core OOP concepts and examples.",embed:false},
      {id:"oop-letshelp",title:"Academic Resource Directory",provider:"Let's Help Everyone",url:`${LETS_HELP}/year/CSE-2nd`,description:"Public academic directory for subject materials.",embed:true}
    ]
  },
  {
    id:"development",title:"Development",description:"Web development, software engineering, tools, and practical roadmaps.",
    resources:[
      {id:"dev-gfg",title:"Web Development",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/websites-apps/web-development/",description:"Web-development learning resources.",embed:false},
      {id:"dev-letshelp",title:"Learning Hub",provider:"Let's Help Everyone",url:`${LETS_HELP}/learninghub`,description:"Public roadmaps, guides, and references.",embed:true}
    ]
  },
  {
    id:"cybersecurity",title:"Cybersecurity",description:"Security fundamentals, networking security, and defensive learning resources.",
    resources:[
      {id:"cyber-gfg",title:"Cyber Security Tutorial",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/cyber-security/",description:"Cybersecurity concepts and tutorials.",embed:false},
      {id:"cyber-letshelp",title:"Learning Hub",provider:"Let's Help Everyone",url:`${LETS_HELP}/learninghub`,description:"Public guides and references.",embed:true}
    ]
  },
  {
    id:"interview-preparation",title:"Interview Preparation",description:"Core CS preparation, DSA, projects, resumes, and interview guidance.",
    resources:[
      {id:"interview-gfg",title:"Interview Preparation Roadmap",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/blogs/interview-preparation-roadmap/",description:"A roadmap covering DSA, CS fundamentals, and interviews.",embed:false},
      {id:"interview-letshelp",title:"Learning Hub",provider:"Let's Help Everyone",url:`${LETS_HELP}/learninghub`,description:"Public placement and learning guides.",embed:true}
    ]
  },
  {
    id:"system-design",title:"System Design",description:"Scalability, distributed systems, high-level design, and architecture.",
    resources:[
      {id:"system-design-gfg",title:"System Design",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/system-design/",description:"System-design concepts and guides.",embed:false},
      {id:"system-design-letshelp",title:"System Design Resources",provider:"Let's Help Everyone",url:`${LETS_HELP}/CSE-3rd/System%20Design`,description:"Public System Design subject page.",embed:true}
    ]
  }
];

function safeUrl(value){
  const u=new URL(String(value||""));
  if(u.protocol!=="https:")throw new Error("Resource URL must use HTTPS");
  return u.toString();
}

async function catalog(req,res){
  const resources=SUBJECTS.flatMap(subject=>subject.resources.map(resource=>({
    _id:resource.id,
    title:resource.title,
    category:subject.title,
    source:resource.provider,
    url:resource.url,
    description:resource.description,
    provider:resource.provider,
    subjectId:subject.id,
    embed:resource.embed
  })));

  res.json({
    subjects:SUBJECTS,
    resources,
    providers:[
      {id:"letshelp",name:"Let's Help Everyone",baseUrl:LETS_HELP,mode:"public-directory"},
      {id:"gfg",name:"GeeksforGeeks",baseUrl:GFG,mode:"official-links"}
    ]
  });
}

async function listBookmarks(req,res,next){
  try{
    const q=String(req.query.q||"").trim();
    const query={user:req.user._id};
    if(q)query.$or=[
      {title:{$regex:q,$options:"i"}},
      {category:{$regex:q,$options:"i"}},
      {notes:{$regex:q,$options:"i"}}
    ];
    if(req.query.category)query.category=String(req.query.category);
    const bookmarks=await ResourceBookmark.find(query).sort({updatedAt:-1}).lean();
    res.json({bookmarks});
  }catch(e){next(e);}
}

async function saveBookmark(req,res,next){
  try{
    const title=String(req.body.title||"").trim();
    if(!title){res.status(400);throw new Error("Resource title is required");}
    const url=safeUrl(req.body.url);
    const bookmark=await ResourceBookmark.findOneAndUpdate(
      {user:req.user._id,url},
      {
        title,
        url,
        category:String(req.body.category||"General"),
        source:String(req.body.source||"external"),
        notes:String(req.body.notes||"").trim()
      },
      {new:true,upsert:true,setDefaultsOnInsert:true,runValidators:true}
    );
    res.status(201).json({bookmark});
  }catch(e){next(e);}
}

async function deleteBookmark(req,res,next){
  try{
    const bookmark=await ResourceBookmark.findOneAndDelete({_id:req.params.id,user:req.user._id});
    if(!bookmark){res.status(404);throw new Error("Saved resource not found");}
    res.json({message:"Resource removed"});
  }catch(e){next(e);}
}

module.exports={catalog,listBookmarks,saveBookmark,deleteBookmark};
