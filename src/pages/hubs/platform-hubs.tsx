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
type Bookmark={_id:string;title:string;url:string;category:string;source:string;description?:string;provider?:string;subjectId?:string;embed?:boolean};
type ResourceEntry={id:string;title:string;provider:string;url:string;description:string;embed?:boolean};
type SubjectNode={id:string;title:string;description:string;resources:ResourceEntry[]};
type Resume={_id:string;name:string;template:string;updatedAt:string};

function Shell({title,description,children}:{title:string;description:string;children:ReactNode}){return <div className="mx-auto max-w-6xl space-y-6"><div><h1 className="text-3xl font-bold text-[var(--text-primary)]">{title}</h1><p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p></div>{children}</div>}
function State({loading,error,empty}:{loading:boolean;error:string|null;empty:string}){if(loading)return <div className="surface-card rounded-2xl p-10 text-center text-[var(--text-secondary)]"><Loader2 className="mx-auto mb-3 animate-spin"/>Loading…</div>;if(error)return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>;return <div className="surface-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">{empty}</div>;}

export function CodingHubPage(){
  type SheetItem={id:string;title:string;url:string;platform:string;difficulty?:string;topic?:string;description?:string};
  type Collection={id:string;provider:"codolio"|"tle";title:string;category:string;description:string;sourceUrl:string;items:SheetItem[]};
  type Catalog={collections:Collection[];sources:{codolio:string;tle:string};updatedAt:string};
  type Progress={collectionId:string;itemId:string;done:boolean};

  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [sheets,setSheets]=useState<Sheet[]>([]);
  const [catalog,setCatalog]=useState<Catalog|null>(null);
  const [progress,setProgress]=useState<Progress[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [savingSheet,setSavingSheet]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [platform,setPlatform]=useState("leetcode");
  const [username,setUsername]=useState("");
  const [provider,setProvider]=useState<"all"|"codolio"|"tle">("all");
  const [activeCollection,setActiveCollection]=useState<Collection|null>(null);

  const load=async()=>{
    try{
      setLoading(true);setError(null);
      const [p,s,c]=await Promise.all([
        api.get<{profiles:Profile[]}>("/accounts/coding/profiles"),
        api.get<{sheets:Sheet[]}>("/learning-sheets"),
        api.get<Catalog>("/learning-sheets/catalog")
      ]);
      setProfiles(p.data.profiles||[]);setSheets(s.data.sheets||[]);setCatalog(c.data);
      try{const pg=await api.get<{progress:Progress[]}>("/learning-sheets/progress");setProgress(pg.data.progress||[]);}catch{/* catalog remains available without auth */}
    }catch{setError("Unable to load Coding Hub. Please check your connection and try again.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[]);

  const add=async()=>{
    const cleanUsername=username.trim();if(!cleanUsername){setError("Enter a username before adding a coding profile.");return;}
    try{
      setSaving(true);setError(null);
      const response=await api.post<{profile:Profile}>("/accounts/coding/profiles",{platform,username:cleanUsername});
      setProfiles(prev=>{const next=response.data.profile;const i=prev.findIndex(p=>p.platform===next.platform);return i===-1?[...prev,next]:prev.map((p,index)=>index===i?next:p);});
      setUsername("");
    }catch(err){const e=err as AxiosError<{message?:string}>;setError(e.response?.status===401?"Your session has expired. Please sign in again.":e.response?.data?.message||"Unable to save coding profile. Please try again.");}
    finally{setSaving(false);}
  };

  const saveSheet=async(collection:Collection)=>{
    if(!collection.sourceUrl)return;
    try{
      setSavingSheet(collection.id);setError(null);
      const response=await api.post<{sheet:Sheet}>("/learning-sheets",{title:collection.title,url:collection.sourceUrl,source:collection.provider,description:collection.description,isBookmarked:true});
      setSheets(prev=>prev.some(x=>x._id===response.data.sheet._id)?prev.map(x=>x._id===response.data.sheet._id?response.data.sheet:x):[response.data.sheet,...prev]);
    }catch(err){const e=err as AxiosError<{message?:string}>;setError(e.response?.data?.message||"Unable to save this sheet.");}
    finally{setSavingSheet(null);}
  };

  const toggleProgress=async(item:SheetItem)=>{
    if(!activeCollection)return;
    const key=activeCollection.id+"::"+item.id;
    const current=progress.find(x=>x.collectionId+"::"+x.itemId===key)?.done||false;
    try{
      const response=await api.put<{progress:Progress}>("/learning-sheets/progress/"+encodeURIComponent(activeCollection.id)+"/"+encodeURIComponent(item.id),{done:!current});
      setProgress(prev=>{const i=prev.findIndex(x=>x.collectionId===activeCollection.id&&x.itemId===item.id);return i===-1?[...prev,response.data.progress]:prev.map((x,index)=>index===i?response.data.progress:x);});
    }catch{setError("Sign in to save question progress in GradeWise.");}
  };

  const sync=async()=>{
    try{setSyncing(true);setError(null);const r=await api.post<Catalog>("/learning-sheets/catalog/sync");setCatalog(r.data);if(activeCollection){setActiveCollection(r.data.collections.find(x=>x.id===activeCollection.id)||null);}}
    catch{setError("Unable to refresh provider data.");}finally{setSyncing(false);}
  };

  const removeSheet=async(id:string)=>{try{await api.delete("/learning-sheets/"+id);setSheets(prev=>prev.filter(x=>x._id!==id));}catch{setError("Unable to remove saved sheet.");}};

  if(activeCollection){
    const doneCount=activeCollection.items.filter(item=>progress.some(x=>x.collectionId===activeCollection.id&&x.itemId===item.id&&x.done)).length;
    return <Shell title="Coding Hub" description="A native learning workspace — no provider pages are embedded.">
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="border-b border-[var(--border)] p-5">
          <button onClick={()=>setActiveCollection(null)} className="text-sm font-medium text-purple-600 hover:underline">← Back to Learning Sheets</button>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-purple-600">{activeCollection.provider==="tle"?"TLE Eliminators":"Codolio"}</span><span className="rounded-full bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-[var(--text-secondary)]">{activeCollection.category}</span></div><h2 className="mt-3 text-2xl font-semibold">{activeCollection.title}</h2><p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">{activeCollection.description}</p></div>
            <Button variant="outline" onClick={()=>void saveSheet(activeCollection)} disabled={savingSheet===activeCollection.id}>{savingSheet===activeCollection.id?<Loader2 size={15} className="animate-spin"/>:<Save size={15}/>}Save</Button>
          </div>
        </div>
        <div className="p-5">
          {activeCollection.items.length===0?<div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center"><Layers className="mx-auto text-purple-600"/><h3 className="mt-3 font-semibold">Source sync is ready</h3><p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)]">This collection is rendered natively in GradeWise. Configure the provider's permitted JSON catalog endpoint on the backend to populate its questions here; GradeWise does not iframe or scrape protected provider pages.</p><Button className="mt-4" onClick={()=>void sync()} disabled={syncing}>{syncing?<Loader2 size={15} className="animate-spin"/>:<Layers size={15}/>}Refresh source data</Button></div>:<>
            <div className="mb-4 flex items-center justify-between text-sm"><span className="text-[var(--text-secondary)]">{doneCount} of {activeCollection.items.length} completed</span><span className="font-medium text-purple-600">{Math.round(doneCount/activeCollection.items.length*100)}%</span></div>
            <div className="space-y-2">{activeCollection.items.map((item,index)=>{const done=progress.some(x=>x.collectionId===activeCollection.id&&x.itemId===item.id&&x.done);return <article key={item.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border)] p-4 sm:flex-row sm:items-center"><button aria-label={"Mark "+item.title+" as "+(done?"not completed":"completed")} onClick={()=>void toggleProgress(item)} className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold "+(done?"border-emerald-500 bg-emerald-500 text-white":"border-[var(--border)] text-[var(--text-secondary)]")}>{done?"✓":index+1}</button><div className="min-w-0 flex-1"><p className={done?"font-medium line-through opacity-60":"font-medium"}>{item.title}</p><div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">{item.platform&&<span>{item.platform}</span>}{item.difficulty&&<span>• {item.difficulty}</span>}{item.topic&&<span>• {item.topic}</span>}</div>{item.description&&<p className="mt-1 text-xs text-[var(--text-secondary)]">{item.description}</p>}</div><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg-surface-elevated)]">Open problem <ExternalLink size={14}/></a></article>;})}</div>
          </>}
        </div>
      </section>
    </Shell>;
  }

  const collections=(catalog?.collections||[]).filter(x=>provider==="all"||x.provider===provider);
  return <Shell title="Coding Hub" description="Connect coding profiles, study normalized sheets, and track progress in one workspace.">
    {error&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
      <section className="surface-card rounded-2xl p-5"><div className="mb-4 flex items-center gap-2"><Code2 size={18}/><h2 className="font-semibold">Coding Profiles</h2></div><div className="flex gap-2"><select value={platform} onChange={e=>setPlatform(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm"><option value="leetcode">LeetCode</option><option value="geeksforgeeks">GeeksforGeeks</option><option value="codeforces">Codeforces</option><option value="hackerrank">HackerRank</option></select><input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void add();}}} placeholder="Username" disabled={saving} className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm"/><Button onClick={()=>void add()} disabled={saving}>{saving?<Loader2 size={15} className="animate-spin"/>:<Plus size={15}/>}Add</Button></div><div className="mt-4 space-y-2">{loading?<p className="text-sm text-[var(--text-secondary)]">Loading profiles…</p>:profiles.length===0?<p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">No coding profiles connected yet.</p>:profiles.map(p=><div key={p._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3"><div><p className="font-medium capitalize">{p.platform}</p><p className="text-xs text-[var(--text-secondary)]">{p.username}</p></div><a href={p.profileUrl} target="_blank" rel="noreferrer" className="text-purple-600"><ExternalLink size={16}/></a></div>)}</div></section>

      <section className="surface-card rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Layers size={18}/><h2 className="font-semibold">Learning Sheets</h2></div><p className="mt-1 text-sm text-[var(--text-secondary)]">Questions are rendered as GradeWise data cards, not embedded provider websites.</p></div><Button variant="outline" onClick={()=>void sync()} disabled={syncing}>{syncing?<Loader2 size={15} className="animate-spin"/>:<Layers size={15}/>}Refresh</Button></div>
        <div className="mt-4 flex flex-wrap gap-2">{(["all","codolio","tle"] as const).map(value=><button key={value} onClick={()=>setProvider(value)} className={"rounded-full px-3 py-2 text-sm "+(provider===value?"bg-purple-600 text-white":"border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]")}>{value==="all"?"All":value==="tle"?"TLE":"Codolio"}</button>)}</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{loading?<p className="text-sm text-[var(--text-secondary)]">Loading catalog…</p>:collections.map(c=><button key={c.id} onClick={()=>setActiveCollection(c)} className="group rounded-2xl border border-[var(--border)] p-4 text-left transition hover:-translate-y-0.5 hover:border-purple-500/50 hover:shadow-lg"><div className="flex items-center justify-between"><span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-600">{c.provider==="tle"?"TLE":"Codolio"}</span><ExternalLink size={15} className="text-[var(--text-tertiary)] group-hover:text-purple-600"/></div><h3 className="mt-4 font-semibold">{c.title}</h3><p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{c.description}</p><div className="mt-4 text-xs text-[var(--text-tertiary)]">{c.items.length?c.items.length+" questions":"Native collection"}</div></button>)}</div>
      </section>
    </div>
    <section className="surface-card rounded-2xl p-5"><h2 className="font-semibold">My Saved Sheets</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Personal shortcuts stored in GradeWise.</p><div className="mt-4 grid gap-2 md:grid-cols-2">{sheets.length===0?<p className="text-sm text-[var(--text-secondary)]">No sheets saved yet.</p>:sheets.map(sheet=><div key={sheet._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3"><div><p className="font-medium">{sheet.title}</p><p className="text-xs text-[var(--text-secondary)]">{sheet.source}</p></div><button onClick={()=>void removeSheet(sheet._id)} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]" aria-label={"Remove "+sheet.title}><Trash2 size={16}/></button></div>)}</div></section>
    <section className="surface-card rounded-2xl p-5"><h2 className="font-semibold">Connected Accounts</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Manage profile links and connection status from Settings.</p><Link to="/app/settings" className="mt-3 inline-block text-sm font-medium text-purple-600">Open Settings →</Link></section>
  </Shell>;
}

export function ResourcesHubPage(){
  const [subjects,setSubjects]=useState<SubjectNode[]>([]);
  const [saved,setSaved]=useState<Bookmark[]>([]);
  const [loadingCatalog,setLoadingCatalog]=useState(true);
  const [loadingSaved,setLoadingSaved]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [savedError,setSavedError]=useState<string|null>(null);
  const [selectedSubject,setSelectedSubject]=useState<SubjectNode|null>(null);
  const [activeResource,setActiveResource]=useState<ResourceEntry|null>(null);

  const loadCatalog=async()=>{
    try{
      setLoadingCatalog(true);setError(null);
      const response=await api.get<{subjects:SubjectNode[]}>("/resource-hub/catalog");
      setSubjects(response.data.subjects||[]);
    }catch{
      setError("Unable to load the resource catalog. Please try again.");
    }finally{setLoadingCatalog(false);}
  };

  const loadSaved=async()=>{
    try{
      setLoadingSaved(true);setSavedError(null);
      const response=await api.get<{bookmarks:Bookmark[]}>("/resource-hub/saved");
      setSaved(response.data.bookmarks||[]);
    }catch(err){
      const axiosError=err as AxiosError<{message?:string}>;
      setSavedError(axiosError.response?.status===401?"Your session has expired. Please sign in again.":"Unable to load saved resources.");
    }finally{setLoadingSaved(false);}
  };

  useEffect(()=>{void loadCatalog();void loadSaved();},[]);

  const save=async(r:ResourceEntry|Bookmark)=>{
    try{
      setSavedError(null);
      const response=await api.post<{bookmark:Bookmark}>("/resource-hub/saved",{
        title:r.title,url:r.url,category:("category" in r&&r.category)||selectedSubject?.title||"General",source:("provider" in r&&r.provider)||(("source" in r&&r.source)||"external")
      });
      setSaved(prev=>prev.some(item=>item._id===response.data.bookmark._id)?prev.map(item=>item._id===response.data.bookmark._id?response.data.bookmark:item):[response.data.bookmark,...prev]);
    }catch(err){
      const axiosError=err as AxiosError<{message?:string}>;
      setSavedError(axiosError.response?.data?.message||"Unable to save resource.");
    }
  };

  const removeSaved=async(id:string)=>{
    try{await api.delete("/resource-hub/saved/"+id);setSaved(prev=>prev.filter(item=>item._id!==id));}
    catch{setSavedError("Unable to remove saved resource.");}
  };

  if(activeResource){
    return <Shell title="Resources" description="Study material and useful learning resources in one place.">
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={()=>setActiveResource(null)} className="text-sm font-medium text-purple-600 hover:underline">← Back to {selectedSubject?.title||"resources"}</button>
            <h2 className="mt-1 font-semibold">{activeResource.title}</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{activeResource.provider}</p>
          </div>
          <Button onClick={()=>void save(activeResource)}><Save size={15}/>Save</Button>
        </div>
        {activeResource.embed!==false?<div className="bg-[var(--bg-surface)] p-2 sm:p-4">
          <iframe src={activeResource.url} title={activeResource.title} className="h-[72vh] w-full rounded-xl border border-[var(--border)] bg-white" referrerPolicy="strict-origin-when-cross-origin"/>
        </div>:<div className="p-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-6 text-center">
            <BookOpen className="mx-auto text-purple-600"/>
            <h3 className="mt-3 font-semibold">Official resource</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{activeResource.description}</p>
            <p className="mt-3 text-xs text-[var(--text-tertiary)]">This provider does not offer a reliable embeddable reader, so GradeWise does not bypass its access controls or copy the content.</p>
            <a href={activeResource.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white">Open official resource <ExternalLink size={15}/></a>
          </div>
        </div>}
      </section>
    </Shell>;
  }

  return <Shell title="Resources" description="Browse subjects first, then choose a resource provider in a single combined tree.">
    {loadingCatalog||error?<State loading={loadingCatalog} error={error} empty=""/>:selectedSubject?<>
      <section className="surface-card rounded-2xl p-5">
        <button onClick={()=>setSelectedSubject(null)} className="text-sm font-medium text-purple-600 hover:underline">← Back to all subjects</button>
        <h2 className="mt-2 text-xl font-semibold">{selectedSubject.title}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{selectedSubject.description}</p>
      </section>
      <section className="surface-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2"><Layers size={18}/><h3 className="font-semibold">Resource tree</h3></div>
        <div className="space-y-3">
          {selectedSubject.resources.map((resource,index)=><div key={resource.id} className="rounded-xl border border-[var(--border)] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">{index+1}</div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{resource.title}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{resource.provider}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{resource.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={()=>setActiveResource(resource)}><BookOpen size={15}/>{resource.embed===false?"Resource details":"Study here"}</Button>
                  <Button onClick={()=>void save(resource)}><Save size={15}/>Save</Button>
                </div>
              </div>
            </div>
          </div>)}
        </div>
      </section>
    </>:<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {subjects.map(subject=><button key={subject.id} onClick={()=>setSelectedSubject(subject)} className="surface-card rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg">
        <BookOpen className="text-purple-600"/>
        <h2 className="mt-3 font-semibold">{subject.title}</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{subject.description}</p>
        <div className="mt-4 flex items-center justify-between text-sm text-purple-600"><span>{subject.resources.length} sources</span><span>Open →</span></div>
      </button>)}
      {subjects.length===0&&<State loading={false} error={null} empty="No subjects are available yet."/>}
    </section>}

    <section className="surface-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-semibold">Saved Resources</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Your personal resource shortcuts.</p></div>
        {savedError&&<span className="text-xs text-red-600 dark:text-red-300">{savedError}</span>}
      </div>
      {loadingSaved?<div className="py-5 text-sm text-[var(--text-secondary)]">Loading saved resources…</div>:saved.length===0?<div className="py-5 text-sm text-[var(--text-secondary)]">No saved resources yet.</div>:<div className="mt-3 grid gap-2 md:grid-cols-2">
        {saved.map(r=><div key={r._id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3">
          <button onClick={()=>setActiveResource({id:r._id,title:r.title,provider:r.source,url:r.url,description:r.description||"",embed:r.embed})} className="min-w-0 text-left hover:text-purple-600"><p className="truncate font-medium">{r.title}</p><span className="text-xs text-[var(--text-tertiary)]">{r.category}</span></button>
          <div className="flex shrink-0 gap-1">
            <button aria-label={"View "+r.title} onClick={()=>setActiveResource({id:r._id,title:r.title,provider:r.source,url:r.url,description:r.description||"",embed:r.embed})} className="rounded-lg p-2 text-purple-600 hover:bg-[var(--bg-surface-elevated)]"><BookOpen size={16}/></button>
            <button aria-label={"Remove "+r.title} onClick={()=>void removeSaved(r._id)} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"><Trash2 size={16}/></button>
          </div>
        </div>)}
      </div>}
    </section>
  </Shell>;
}

export function ResumeHubPage(){const [items,setItems]=useState<Resume[]>([]);const [name,setName]=useState("");const [job,setJob]=useState("");const [result,setResult]=useState<Record<string,unknown>|null>(null);const load=async()=>{const r=await api.get<{resumes:Resume[]}>("/resumes");setItems(r.data.resumes);};useEffect(()=>{load().catch(()=>{});},[]);const create=async()=>{const r=await api.post<{resume:Resume}>("/resumes",{name:name||"Untitled Resume",template:"classic",data:{personal:{},education:[],skills:[],projects:[],experience:[],certifications:[],links:[]}});setItems(v=>[r.data.resume,...v]);setName("");};const analyze=async()=>{if(!job.trim())return;const r=await api.post<{analysis:Record<string,unknown>}>("/resumes/ats",{resumeId:items[0]?._id,jobDescription:job});setResult(r.data.analysis);};return <Shell title="Resume Hub" description="Build independent resume versions, export structured data, and run an internal compatibility estimate."><div className="grid gap-6 lg:grid-cols-2"><section className="surface-card rounded-2xl p-5"><h2 className="font-semibold">Resume Versions</h2><div className="mt-3 flex gap-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Resume name" className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm"/><Button onClick={create}><Plus size={15}/>Create</Button></div><div className="mt-4 space-y-2">{items.map(r=><div key={r._id} className="rounded-xl border border-[var(--border)] p-3"><p className="font-medium">{r.name}</p><p className="text-xs text-[var(--text-secondary)]">{r.template} template</p></div>)}</div></section><section className="surface-card rounded-2xl p-5"><h2 className="font-semibold">ATS Analysis</h2><textarea value={job} onChange={e=>setJob(e.target.value)} placeholder="Paste a job description" className="mt-3 min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-sm"/><Button className="mt-3" onClick={analyze}><Save size={15}/>Analyze</Button>{result&&<pre className="mt-4 overflow-auto rounded-xl bg-[var(--bg-surface-elevated)] p-3 text-xs text-[var(--text-secondary)]">{JSON.stringify(result,null,2)}</pre>}</section></div></Shell>;}

export function GitHubHubPage(){return <Shell title="GitHub" description="Repository browsing and user-controlled imports/exports use official GitHub OAuth and APIs when configured."><section className="surface-card rounded-2xl p-6"><GitBranch size={28} className="text-purple-600"/><h2 className="mt-3 text-xl font-semibold">Connect GitHub</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">OAuth configuration is environment-dependent. GradeWise should never ask for your GitHub password, and repository writes must require explicit confirmation.</p><p className="mt-4 text-xs text-[var(--text-tertiary)]">The existing repository-linking module remains separate from this hub.</p></section></Shell>;}