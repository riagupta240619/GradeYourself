import { useEffect, useState, type ReactNode } from "react";
import type { AxiosError } from "axios";
import { Link } from "react-router-dom";
import { BookOpen, Code2, FileText, GitBranch, Layers, Loader2, Plus, Save, ExternalLink, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { SubjectSearchBar, SUBJECT_METADATA, type SubjectNode } from "@/components/resources/subject-search-bar";
import { ResourcesPage } from "@/pages/resources/resources-page";
import { ResumeHubPage as StackedResumeHubPage } from "@/pages/resume/resume-hub-page";

type Account={_id:string;platform:string;username:string;profileUrl:string;connectionType:string;status:string};
type Profile={_id:string;platform:string;username:string;profileUrl:string;stats?:Record<string,unknown>};
type Sheet={_id:string;title:string;url:string;source:string;description?:string};
type PublicSheet={id:string;provider:"codolio"|"tle";title:string;category:string;description:string;url:string;externalOnly?:boolean;ratings?:number[]};
type Bookmark={_id:string;title:string;url:string;category:string;source:string;description?:string;provider?:string;subjectId?:string;embed?:boolean};
type ResourceEntry={id:string;title:string;provider:string;url:string;description:string;embed?:boolean};
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
  const [searchQuery,setSearchQuery]=useState("");
  const [difficultyFilter,setDifficultyFilter]=useState<string>("all");

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
    const pct=activeCollection.items.length?Math.round(doneCount/activeCollection.items.length*100):0;
    
    // Unique difficulties in the current collection
    const difficulties=Array.from(new Set(activeCollection.items.map(i=>i.difficulty).filter(Boolean))) as string[];
    
    // Filter items based on search and difficulty
    const filteredItems=activeCollection.items.filter(item=>{
      const matchesSearch=!searchQuery.trim() || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.topic && item.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.platform && item.platform.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty=difficultyFilter==="all" || item.difficulty===difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });

    return <Shell title="Coding Hub" description="A native learning workspace — problems open directly without embed restrictions.">
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="border-b border-[var(--border)] p-5">
          <button onClick={()=>{setActiveCollection(null);setSearchQuery("");setDifficultyFilter("all");}} className="text-sm font-medium text-purple-600 hover:underline">← Back to Learning Sheets</button>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-purple-500/10 px-2.5 py-1 font-semibold text-purple-600">{activeCollection.provider==="tle"?"TLE Eliminators":"Codolio"}</span>
                <span className="rounded-full bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-[var(--text-secondary)]">{activeCollection.category}</span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600">{activeCollection.items.length} Problems</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold">{activeCollection.title}</h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">{activeCollection.description}</p>
            </div>
            <Button variant="outline" onClick={()=>void saveSheet(activeCollection)} disabled={savingSheet===activeCollection.id}>{savingSheet===activeCollection.id?<Loader2 size={15} className="animate-spin"/>:<Save size={15}/>}Save Sheet</Button>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[var(--text-secondary)]">{doneCount} of {activeCollection.items.length} completed</span>
              <span className="font-bold text-purple-600">{pct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)]">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300" style={{width:`${pct}%`}}/>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e=>setSearchQuery(e.target.value)} 
              placeholder="Search problems by name or topic…" 
              className="min-w-0 max-w-xs flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
            />
            {difficulties.length>1 && (
              <div className="flex flex-wrap gap-1.5 items-center text-xs">
                <span className="text-[var(--text-secondary)] mr-1">Filter:</span>
                <button onClick={()=>setDifficultyFilter("all")} className={"rounded-lg px-2.5 py-1.5 font-medium "+(difficultyFilter==="all"?"bg-purple-600 text-white":"border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]")}>All ({activeCollection.items.length})</button>
                {difficulties.map(d=>(
                  <button key={d} onClick={()=>setDifficultyFilter(d)} className={"rounded-lg px-2.5 py-1.5 font-medium "+(difficultyFilter===d?"bg-purple-600 text-white":"border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]")}>
                    {d} ({activeCollection.items.filter(x=>x.difficulty===d).length})
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeCollection.items.length===0?<div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center"><Layers className="mx-auto text-purple-600"/><h3 className="mt-3 font-semibold">No questions are available</h3><p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)]">This sheet was not opened with imported question data. Go back to Learning Sheets and refresh the catalog.</p><Button className="mt-4" variant="outline" onClick={()=>setActiveCollection(null)}>Back to Learning Sheets</Button></div>:filteredItems.length===0?<div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center"><p className="text-sm text-[var(--text-secondary)]">No problems match your current search/filter.</p><Button className="mt-3" variant="outline" onClick={()=>{setSearchQuery("");setDifficultyFilter("all");}}>Clear filters</Button></div>:<>
            <div className="space-y-2.5">
              {filteredItems.map((item,index)=>{
                const done=progress.some(x=>x.collectionId===activeCollection.id&&x.itemId===item.id&&x.done);
                const platformBadgeColor = item.platform==="Codeforces" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : item.platform==="LeetCode" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                
                return <article key={item.id} className={"flex flex-col gap-3 rounded-xl border p-4 transition sm:flex-row sm:items-center "+(done?"border-emerald-500/30 bg-emerald-500/5":"border-[var(--border)] bg-[var(--bg-surface)] hover:border-purple-500/30")}>
                  <button aria-label={"Mark "+item.title+" as "+(done?"not completed":"completed")} onClick={()=>void toggleProgress(item)} className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition "+(done?"border-emerald-500 bg-emerald-500 text-white shadow-sm":"border-[var(--border)] text-[var(--text-secondary)] hover:border-purple-500 hover:text-purple-600")}>
                    {done?"✓":index+1}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={"text-base font-semibold "+(done?"line-through opacity-70":"text-[var(--text-primary)]")}>{item.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {item.platform&&<span className={"rounded-md px-2 py-0.5 font-medium "+platformBadgeColor}>{item.platform}</span>}
                      {item.difficulty&&<span className="rounded-md bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[var(--text-secondary)] font-medium">Difficulty: {item.difficulty}</span>}
                      {item.topic&&<span className="rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 font-medium">{item.topic}</span>}
                    </div>
                    {item.description&&<p className="mt-1 text-xs text-[var(--text-secondary)]">{item.description}</p>}
                  </div>
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-4 py-2 text-sm font-medium hover:bg-purple-600 hover:text-white transition">
                    Solve Problem <ExternalLink size={14}/>
                  </a>
                </article>;
              })}
            </div>
          </>}
        </div>
      </section>
    </Shell>;
  }

  const collections=(catalog?.collections||[]).filter(x=>provider==="all"||x.provider===provider);
  return <Shell title="Coding Hub" description="Connect coding profiles, study normalized sheets, and track progress in one workspace.">
    {error&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-5"><div className="mb-4 flex items-center gap-2"><Code2 size={18}/><h2 className="font-semibold">Coding Profiles</h2></div><div className="flex gap-2"><select value={platform} onChange={e=>setPlatform(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm"><option value="leetcode">LeetCode</option><option value="geeksforgeeks">GeeksforGeeks</option><option value="codeforces">Codeforces</option><option value="hackerrank">HackerRank</option></select><input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void add();}}} placeholder="Username" disabled={saving} className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm"/><Button onClick={()=>void add()} disabled={saving}>{saving?<Loader2 size={15} className="animate-spin"/>:<Plus size={15}/>}Add</Button></div><div className="mt-4 space-y-2">{loading?<p className="text-sm text-[var(--text-secondary)]">Loading profiles…</p>:profiles.length===0?<p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">No coding profiles connected yet.</p>:profiles.map(p=><div key={p._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3"><div><p className="font-medium capitalize">{p.platform}</p><p className="text-xs text-[var(--text-secondary)]">{p.username}</p></div><a href={p.profileUrl} target="_blank" rel="noreferrer" className="text-purple-600"><ExternalLink size={16}/></a></div>)}</div></section>

      <section className="surface-card rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Layers size={18}/><h2 className="font-semibold">Learning Sheets</h2></div><p className="mt-1 text-sm text-[var(--text-secondary)]">Curated problem collections rendered as interactive data cards with direct problem links (no iframe embeds).</p></div><Button variant="outline" onClick={()=>void sync()} disabled={syncing}>{syncing?<Loader2 size={15} className="animate-spin"/>:<Layers size={15}/>}Refresh</Button></div>
        <div className="mt-4 flex flex-wrap gap-2">{(["all","codolio","tle"] as const).map(value=><button key={value} onClick={()=>setProvider(value)} className={"rounded-full px-3 py-2 text-sm "+(provider===value?"bg-purple-600 text-white":"border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]")}>{value==="all"?"All Sheets":value==="tle"?"TLE Eliminators (CP-31)":"Codolio Sheets"}</button>)}</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{loading?<p className="text-sm text-[var(--text-secondary)]">Loading catalog…</p>:collections.length===0?<div className="md:col-span-2 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center"><Layers className="mx-auto text-purple-600"/><h3 className="mt-3 font-semibold">No provider questions are available yet</h3><p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)]">GradeWise lists sheets with verified problem data. Click refresh to reload.</p><Button className="mt-4" onClick={()=>void sync()} disabled={syncing}>{syncing?<Loader2 size={15} className="animate-spin"/>:<Layers size={15}/>}Refresh catalog</Button></div>:collections.map(c=>{
          const sheetDone = c.items.filter(item=>progress.some(x=>x.collectionId===c.id&&x.itemId===item.id&&x.done)).length;
          const sheetPct = c.items.length?Math.round(sheetDone/c.items.length*100):0;
          return <button key={c.id} onClick={()=>setActiveCollection(c)} className="group rounded-2xl border border-[var(--border)] p-5 text-left transition hover:-translate-y-0.5 hover:border-purple-500/50 hover:shadow-lg bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between">
              <span className={"rounded-full px-2.5 py-1 text-xs font-semibold "+(c.provider==="tle"?"bg-amber-500/10 text-amber-600 dark:text-amber-400":"bg-purple-500/10 text-purple-600 dark:text-purple-400")}>
                {c.provider==="tle"?"TLE Eliminators":"Codolio"}
              </span>
              <span className="text-xs text-[var(--text-secondary)] group-hover:text-purple-600 font-medium">Open sheet →</span>
            </div>
            <h3 className="mt-3 font-semibold text-base text-[var(--text-primary)]">{c.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{c.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>{c.items.length} questions</span>
              {sheetDone>0 && <span className="font-semibold text-emerald-600">{sheetDone}/{c.items.length} solved ({sheetPct}%)</span>}
            </div>
            {sheetDone>0 && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-elevated)]">
                <div className="h-full rounded-full bg-emerald-500" style={{width:`${sheetPct}%`}}/>
              </div>
            )}
          </button>;
        })}</div>
      </section>
    </div>
    <section className="surface-card rounded-2xl p-5"><h2 className="font-semibold">My Saved Sheets</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Personal shortcuts stored in GradeWise.</p><div className="mt-4 grid gap-2 md:grid-cols-2">{sheets.length===0?<p className="text-sm text-[var(--text-secondary)]">No sheets saved yet.</p>:sheets.map(sheet=><div key={sheet._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3"><div><p className="font-medium">{sheet.title}</p><p className="text-xs text-[var(--text-secondary)]">{sheet.source}</p></div><button onClick={()=>void removeSheet(sheet._id)} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]" aria-label={"Remove "+sheet.title}><Trash2 size={16}/></button></div>)}</div></section>
    <section className="surface-card rounded-2xl p-5"><h2 className="font-semibold">Connected Accounts</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Manage profile links and connection status from Settings.</p><Link to="/app/settings" className="mt-3 inline-block text-sm font-medium text-purple-600">Open Settings →</Link></section>
  </Shell>;
}

export function ResourcesHubPage(){
  return <ResourcesPage />;
}

export function ResumeHubPage(){
  return <StackedResumeHubPage />;
}

import { GitHubPage } from "@/pages/github/github-page";

export function GitHubHubPage(){
  return <GitHubPage />;
}