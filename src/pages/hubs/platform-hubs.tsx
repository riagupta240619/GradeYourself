import { useEffect, useState, type ReactNode } from "react";
import type { AxiosError } from "axios";
import { Link } from "react-router-dom";
import { BookOpen, Code2, FileText, GitBranch, Layers, Loader2, Plus, Save, ExternalLink, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";

type Account={_id:string;platform:string;username:string;profileUrl:string;connectionType:string;status:string};
type Profile={_id:string;platform:string;username:string;profileUrl:string;stats?:Record<string,unknown>};
type Sheet={_id:string;title:string;url:string;source:string;description?:string};
type PublicSheet={id:string;provider:"codolio"|"tle";title:string;category:string;description:string;url:string;externalOnly?:boolean;ratings?:number[]};
type Bookmark={_id:string;title:string;url:string;category:string;source:string;description?:string};
type Resume={_id:string;name:string;template:string;updatedAt:string};

function Shell({title,description,children}:{title:string;description:string;children:ReactNode}){return <div className="mx-auto max-w-6xl space-y-6"><div><h1 className="text-3xl font-bold text-[var(--text-primary)]">{title}</h1><p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p></div>{children}</div>}
function State({loading,error,empty}:{loading:boolean;error:string|null;empty:string}){if(loading)return <div className="surface-card rounded-2xl p-10 text-center text-[var(--text-secondary)]"><Loader2 className="mx-auto mb-3 animate-spin"/>Loading…</div>;if(error)return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>;return <div className="surface-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">{empty}</div>;}

export function CodingHubPage(){
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [sheets,setSheets]=useState<Sheet[]>([]);
  const [catalog,setCatalog]=useState<PublicSheet[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [savingSheet,setSavingSheet]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [platform,setPlatform]=useState("leetcode");
  const [username,setUsername]=useState("");
  const [provider,setProvider]=useState<"all"|"codolio"|"tle">("all");
  const [activeSheet,setActiveSheet]=useState<PublicSheet|null>(null);

  const load=async()=>{
    try{
      setLoading(true);setError(null);
      const [p,s,c]=await Promise.all([
        api.get<{profiles:Profile[]}>("/accounts/coding/profiles"),
        api.get<{sheets:Sheet[]}>("/learning-sheets"),
        api.get<{sheets:PublicSheet[]}>("/learning-sheets/catalog")
      ]);
      setProfiles(p.data.profiles||[]);
      setSheets(s.data.sheets||[]);
      setCatalog(c.data.sheets||[]);
    }catch{
      setError("Unable to load Coding Hub. Please check your connection and try again.");
    }finally{setLoading(false);}
  };

  useEffect(()=>{void load();},[]);

  const add=async()=>{
    const cleanUsername=username.trim();
    if(!cleanUsername){setError("Enter a username before adding a coding profile.");return;}
    try{
      setSaving(true);setError(null);
      const response=await api.post<{profile:Profile}>("/accounts/coding/profiles",{platform,username:cleanUsername});
      setProfiles(prev=>{
        const next=response.data.profile;
        const index=prev.findIndex(p=>p.platform===next.platform);
        return index===-1?[...prev,next]:prev.map((p,i)=>i===index?next:p);
      });
      setUsername("");
    }catch(err){
      const axiosError=err as AxiosError<{message?:string}>;
      if(axiosError.response?.status===401)setError("Your session has expired. Please sign in again.");
      else if(axiosError.code==="ECONNABORTED")setError("The server took too long to respond. Please try again.");
      else setError(axiosError.response?.data?.message||"Unable to save coding profile. Please try again.");
    }finally{setSaving(false);}
  };

  const saveSheet=async(sheet:PublicSheet)=>{
    try{
      setSavingSheet(sheet.id);setError(null);
      const response=await api.post<{sheet:Sheet}>("/learning-sheets",{
        title:sheet.title,url:sheet.url,source:sheet.provider,description:sheet.description,isBookmarked:true
      });
      setSheets(prev=>prev.some(item=>item._id===response.data.sheet._id)?prev.map(item=>item._id===response.data.sheet._id?response.data.sheet:item):[response.data.sheet,...prev]);
    }catch(err){
      const axiosError=err as AxiosError<{message?:string}>;
      setError(axiosError.response?.status===401?"Your session has expired. Please sign in again.":axiosError.response?.data?.message||"Unable to save this sheet.");
    }finally{setSavingSheet(null);}
  };

  const removeSheet=async(id:string)=>{
    try{
      await api.delete("/learning-sheets/"+id);
      setSheets(prev=>prev.filter(item=>item._id!==id));
    }catch{setError("Unable to remove saved sheet.");}
  };

  const visibleCatalog=provider==="all"?catalog:catalog.filter(sheet=>sheet.provider===provider);

  if(activeSheet){
    return <Shell title="Coding Hub" description="Study and organize learning sheets without leaving your GradeWise workspace.">
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={()=>setActiveSheet(null)} className="text-sm font-medium text-purple-600 hover:underline">← Back to Learning Sheets</button>
            <h2 className="mt-1 font-semibold">{activeSheet.title}</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{activeSheet.provider==="tle"?"TLE Eliminators":"Codolio"} · {activeSheet.category}</p>
          </div>
          <Button variant="outline" onClick={()=>void saveSheet(activeSheet)} disabled={savingSheet===activeSheet.id}>
            {savingSheet===activeSheet.id?<Loader2 size={15} className="animate-spin"/>:<Save size={15}/>}Save sheet
          </Button>
        </div>
        {activeSheet.ratings&&<div className="flex flex-wrap gap-2 border-b border-[var(--border)] p-4">
          {activeSheet.ratings.map(rating=><span key={rating} className="rounded-full bg-[var(--bg-surface-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">{rating}</span>)}
        </div>}
        <div className="bg-[var(--bg-surface)] p-2 sm:p-4">
          <iframe src={activeSheet.url} title={activeSheet.title} className="h-[72vh] w-full rounded-xl border border-[var(--border)] bg-white" referrerPolicy="strict-origin-when-cross-origin"/>
        </div>
        <div className="border-t border-[var(--border)] p-4 text-xs text-[var(--text-secondary)]">
          If the provider blocks embedding, use the official page in a new tab. GradeWise does not bypass provider access controls.
          <a href={activeSheet.url} target="_blank" rel="noreferrer" className="ml-2 font-medium text-purple-600">Open official page <ExternalLink size={13} className="inline"/></a>
        </div>
      </section>
    </Shell>;
  }

  return <Shell title="Coding Hub" description="Keep your coding identity, progress links, and learning sheets in one place.">
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="surface-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2"><Code2 size={18}/><h2 className="font-semibold">Coding Profiles</h2></div>
        <div className="flex gap-2">
          <select value={platform} onChange={e=>setPlatform(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm">
            <option value="leetcode">LeetCode</option><option value="geeksforgeeks">GeeksforGeeks</option><option value="codeforces">Codeforces</option><option value="hackerrank">HackerRank</option>
          </select>
          <input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void add();}}} placeholder="Username" disabled={saving} className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"/>
          <Button onClick={()=>void add()} disabled={saving}>{saving?<Loader2 size={15} className="animate-spin"/>:<Plus size={15}/>} {saving?"Saving…":"Add"}</Button>
        </div>
        {error&&<div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
        {loading?<div className="mt-4"><State loading={true} error={null} empty=""/></div>:profiles.length===0?<div className="mt-4"><State loading={false} error={null} empty="No coding profiles connected yet."/></div>:<div className="mt-4 space-y-2">{profiles.map(p=><div key={p._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3"><div><p className="font-medium capitalize">{p.platform}</p><p className="text-xs text-[var(--text-secondary)]">{p.username}</p></div><a href={p.profileUrl} target="_blank" rel="noreferrer" className="text-purple-600"><ExternalLink size={16}/></a></div>)}</div>}
      </section>

      <section className="surface-card rounded-2xl p-5">
        <div className="flex items-center gap-2"><Layers size={18}/><h2 className="font-semibold">Learning Sheets</h2></div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Browse Codolio collections and TLE Eliminators CP practice sheets from one place. Save the sheets you want to revisit.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["all","codolio","tle"] as const).map(value=><button key={value} onClick={()=>setProvider(value)} className={"rounded-full px-3 py-2 text-sm transition "+(provider===value?"bg-purple-600 text-white":"border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]")}>{value==="all"?"All Sheets":value==="tle"?"TLE CP":"Codolio"}</button>)}
        </div>
        {loading?<div className="mt-4 text-sm text-[var(--text-secondary)]">Loading sheet catalog…</div>:<div className="mt-4 space-y-3">{visibleCatalog.map(sheet=><article key={sheet.id} className="rounded-xl border border-[var(--border)] p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{sheet.title}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{sheet.description}</p><div className="mt-2 flex gap-2 text-xs text-[var(--text-tertiary)]"><span className="rounded-full bg-[var(--bg-surface-elevated)] px-2 py-1">{sheet.provider==="tle"?"TLE Eliminators":"Codolio"}</span><span className="rounded-full bg-[var(--bg-surface-elevated)] px-2 py-1">{sheet.category}</span></div></div></div><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setActiveSheet(sheet)}><BookOpen size={15}/>Study</Button><Button onClick={()=>void saveSheet(sheet)} disabled={savingSheet===sheet.id}>{savingSheet===sheet.id?<Loader2 size={15} className="animate-spin"/>:<Save size={15}/>}Save</Button></div></article>)}</div>}
      </section>
    </div>

    <section className="surface-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">My Saved Sheets</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Your personal shortcuts are stored in GradeWise.</p></div></div>
      {loading?<div className="py-5 text-sm text-[var(--text-secondary)]">Loading saved sheets…</div>:sheets.length===0?<div className="py-5 text-sm text-[var(--text-secondary)]">No sheets saved yet.</div>:<div className="mt-4 grid gap-3 md:grid-cols-2">{sheets.map(sheet=><div key={sheet._id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3"><button onClick={()=>setActiveSheet({id:sheet._id,provider:sheet.source==="tle"?"tle":"codolio",title:sheet.title,category:"Saved",description:sheet.description||"",url:sheet.url})} className="min-w-0 text-left hover:text-purple-600"><p className="truncate font-medium">{sheet.title}</p><p className="text-xs text-[var(--text-secondary)]">{sheet.source}</p></button><button onClick={()=>void removeSheet(sheet._id)} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]" aria-label={"Remove "+sheet.title}><Trash2 size={16}/></button></div>)}</div>}
    </section>

    <section className="surface-card rounded-2xl p-5"><h2 className="font-semibold">Connected Accounts</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Manage profile links and connection status from Settings.</p><Link to="/app/settings" className="mt-3 inline-block text-sm font-medium text-purple-600">Open Settings →</Link></section>
  </Shell>;
}

export function ResourcesHubPage(){
  const [catalog,setCatalog]=useState<Bookmark[]>([]);
  const [saved,setSaved]=useState<Bookmark[]>([]);
  const [loadingCatalog,setLoadingCatalog]=useState(true);
  const [loadingSaved,setLoadingSaved]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [savedError,setSavedError]=useState<string|null>(null);
  const [selectedCategory,setSelectedCategory]=useState("All");
  const [activeResource,setActiveResource]=useState<Bookmark|null>(null);

  const loadCatalog=async()=>{
    try{
      setLoadingCatalog(true);
      setError(null);
      const response=await api.get<{resources:Bookmark[]}>("/resource-hub/catalog");
      setCatalog(response.data.resources||[]);
    }catch{
      setError("Unable to load resources. Please try again.");
    }finally{
      setLoadingCatalog(false);
    }
  };

  const loadSaved=async()=>{
    try{
      setLoadingSaved(true);
      setSavedError(null);
      const response=await api.get<{bookmarks:Bookmark[]}>("/resource-hub/saved");
      setSaved(response.data.bookmarks||[]);
    }catch(err){
      const axiosError=err as AxiosError<{message?:string}>;
      setSavedError(axiosError.response?.status===401?"Your session has expired. Please sign in again.":"Unable to load saved resources.");
    }finally{
      setLoadingSaved(false);
    }
  };

  useEffect(()=>{void loadCatalog();void loadSaved();},[]);

  const save=async(r:Bookmark)=>{
    try{
      setSavedError(null);
      const response=await api.post<{bookmark:Bookmark}>("/resource-hub/saved",{title:r.title,url:r.url,category:r.category,source:r.source});
      setSaved(prev=>prev.some(item=>item._id===response.data.bookmark._id)?prev.map(item=>item._id===response.data.bookmark._id?response.data.bookmark:item):[response.data.bookmark,...prev]);
    }catch(err){
      const axiosError=err as AxiosError<{message?:string}>;
      setSavedError(axiosError.response?.data?.message||"Unable to save resource.");
    }
  };

  const removeSaved=async(id:string)=>{
    try{
      await api.delete("/resource-hub/saved/"+id);
      setSaved(prev=>prev.filter(item=>item._id!==id));
    }catch{
      setSavedError("Unable to remove saved resource.");
    }
  };

  const categories=["All",...Array.from(new Set(catalog.map(item=>item.category).filter(Boolean)))];
  const visibleCatalog=selectedCategory==="All"?catalog:catalog.filter(item=>item.category===selectedCategory);

  if(activeResource){
    return <Shell title="Resources" description="Study material and useful learning resources in one place.">
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={()=>setActiveResource(null)} className="text-sm font-medium text-purple-600 hover:underline">← Back to resources</button>
            <h2 className="mt-1 font-semibold">{activeResource.title}</h2>
          </div>
          <span className="rounded-full bg-[var(--bg-surface-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">{activeResource.category}</span>
        </div>
        <div className="bg-[var(--bg-surface)] p-2 sm:p-4">
          <iframe
            src={activeResource.url}
            title={activeResource.title}
            className="h-[72vh] w-full rounded-xl border border-[var(--border)] bg-white"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>
    </Shell>;
  }

  return <Shell title="Resources" description="Study material, coding resources, and saved links.">
    <section className="surface-card rounded-2xl p-5">
      <div className="flex flex-wrap gap-2">
        {categories.map(category=><button key={category} onClick={()=>setSelectedCategory(category)} className={"rounded-full px-3 py-2 text-sm transition "+(selectedCategory===category?"bg-purple-600 text-white":"border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]")}>{category}</button>)}
      </div>
    </section>

    {loadingCatalog||error?<State loading={loadingCatalog} error={error} empty=""/>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleCatalog.map(r=><article key={r.title} className="surface-card rounded-2xl p-5">
        <BookOpen className="text-purple-600"/>
        <h2 className="mt-3 font-semibold">{r.title}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{r.description}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={()=>setActiveResource(r)}>View here</Button>
          <Button onClick={()=>void save(r)}><Save size={15}/>Save</Button>
        </div>
      </article>)}
      {visibleCatalog.length===0&&<State loading={false} error={null} empty="No resources found for this category."/>}
    </div>}

    <section className="surface-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Saved Resources</h2>
        {savedError&&<span className="text-xs text-red-600 dark:text-red-300">{savedError}</span>}
      </div>
      {loadingSaved?<div className="py-5 text-sm text-[var(--text-secondary)]">Loading saved resources…</div>:saved.length===0?<div className="py-5 text-sm text-[var(--text-secondary)]">No saved resources yet.</div>:<div className="mt-3 grid gap-2 md:grid-cols-2">
        {saved.map(r=><div key={r._id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3">
          <button onClick={()=>setActiveResource(r)} className="min-w-0 text-left hover:text-purple-600">
            <p className="truncate font-medium">{r.title}</p>
            <span className="text-xs text-[var(--text-tertiary)]">{r.category}</span>
          </button>
          <div className="flex shrink-0 gap-1">
            <button aria-label={"View "+r.title} onClick={()=>setActiveResource(r)} className="rounded-lg p-2 text-purple-600 hover:bg-[var(--bg-surface-elevated)]"><BookOpen size={16}/></button>
            <button aria-label={"Remove "+r.title} onClick={()=>void removeSaved(r._id)} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"><Trash2 size={16}/></button>
          </div>
        </div>)}
      </div>}
    </section>
  </Shell>;
}

export function ResumeHubPage(){const [items,setItems]=useState<Resume[]>([]);const [name,setName]=useState("");const [job,setJob]=useState("");const [result,setResult]=useState<Record<string,unknown>|null>(null);const load=async()=>{const r=await api.get<{resumes:Resume[]}>("/resumes");setItems(r.data.resumes);};useEffect(()=>{load().catch(()=>{});},[]);const create=async()=>{const r=await api.post<{resume:Resume}>("/resumes",{name:name||"Untitled Resume",template:"classic",data:{personal:{},education:[],skills:[],projects:[],experience:[],certifications:[],links:[]}});setItems(v=>[r.data.resume,...v]);setName("");};const analyze=async()=>{if(!job.trim())return;const r=await api.post<{analysis:Record<string,unknown>}>("/resumes/ats",{resumeId:items[0]?._id,jobDescription:job});setResult(r.data.analysis);};return <Shell title="Resume Hub" description="Build independent resume versions, export structured data, and run an internal compatibility estimate."><div className="grid gap-6 lg:grid-cols-2"><section className="surface-card rounded-2xl p-5"><h2 className="font-semibold">Resume Versions</h2><div className="mt-3 flex gap-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Resume name" className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm"/><Button onClick={create}><Plus size={15}/>Create</Button></div><div className="mt-4 space-y-2">{items.map(r=><div key={r._id} className="rounded-xl border border-[var(--border)] p-3"><p className="font-medium">{r.name}</p><p className="text-xs text-[var(--text-secondary)]">{r.template} template</p></div>)}</div></section><section className="surface-card rounded-2xl p-5"><h2 className="font-semibold">ATS Analysis</h2><textarea value={job} onChange={e=>setJob(e.target.value)} placeholder="Paste a job description" className="mt-3 min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-sm"/><Button className="mt-3" onClick={analyze}><Save size={15}/>Analyze</Button>{result&&<pre className="mt-4 overflow-auto rounded-xl bg-[var(--bg-surface-elevated)] p-3 text-xs text-[var(--text-secondary)]">{JSON.stringify(result,null,2)}</pre>}</section></div></Shell>;}

export function GitHubHubPage(){return <Shell title="GitHub" description="Repository browsing and user-controlled imports/exports use official GitHub OAuth and APIs when configured."><section className="surface-card rounded-2xl p-6"><GitBranch size={28} className="text-purple-600"/><h2 className="mt-3 text-xl font-semibold">Connect GitHub</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">OAuth configuration is environment-dependent. GradeWise should never ask for your GitHub password, and repository writes must require explicit confirmation.</p><p className="mt-4 text-xs text-[var(--text-tertiary)]">The existing repository-linking module remains separate from this hub.</p></section></Shell>;}