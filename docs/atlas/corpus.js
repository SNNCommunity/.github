const $=id=>document.getElementById(id);
const TOPICS=[
 ["neuron-dynamics","Neuron dynamics"],["learning-plasticity","Learning & plasticity"],
 ["deep-architectures","Deep architectures"],["coding-conversion","Coding & conversion"],
 ["efficiency-hardware","Efficiency & hardware"],["event-vision","Event-based vision"],
 ["robotics-embodied","Robotics & embodied AI"],["sequence-language","Sequence & language"],
 ["neuroscience-bci","Neuroscience & BCI"],["benchmarks-tools","Benchmarks & tools"],
 ["theory-robustness","Theory & robustness"]
];
const FIELDS=["q","topic","year","venue","abstract","sort"];
const LIMIT=24,NAME=id=>TOPICS.find(t=>t[0]===id)?.[1]||id;
const clean=s=>String(s??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
const safeLink=url=>typeof url==="string"&&/^https:\/\//i.test(url)?url:null;
const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!=null)n.textContent=String(text);if(className)n.className=className;return n;};
let all=[],display=LIMIT,selected=-1,curated=new Map(),lastFocus=null;
function state(){
  return Object.fromEntries(FIELDS.map(k=>[k,($(k==="q"?"q":k)?.value||"")]));
}
function parseURL(){
  const u=new URL(location.href);
  for(const k of FIELDS){
    const el=$(k);let v=u.searchParams.get(k)||"";
    if(k==="sort")v=v||"recent";
    el.value=k==="q"?v:([...(el.options||[])].some(o=>o.value===v)?v:k==="sort"?"recent":"");
  }
}
function writeURL(method="push",record=selected){
  const u=new URL(location.pathname,location.origin);
  const q=state();
  for(const k of FIELDS)if(q[k]&&!(k==="sort"&&q[k]==="recent"))u.searchParams.set(k,q[k]);
  if(record>=0)u.searchParams.set("record",String(record));
  u.hash="results";
  if(u.pathname+u.search+u.hash!==location.pathname+location.search+location.hash){
    history[method==="replace"?"replaceState":"pushState"](null,"",u);
  }
}
function rowData(row,i,mask,meta){
  const [title,sectionYear,venueText,paper,code]=row;
  const topics=TOPICS.filter((t,j)=>(mask&(1<<j))!==0).map(t=>t[0]);
  const sameWork=i===75?360:i===360?75:-1;
  return {index:i,title,year:Number(sectionYear)||0,venue:(venueText||"").replace(/\s*20\d{2}\s*$/,"").trim()||"Unspecified",
    originalSource:safeLink(paper||meta.sourceFallback?.[i]),code:safeLink(code),topics,
    firstAuthor:meta.firstAuthors?.[i]||"",
    abstractStatus:meta.editorialOnlyIndices.includes(i)?"editorial":"stored",
    workPartner:sameWork,curated:curated.get(clean(title))||null,search:""};
}
function populate(records){
  const ys=[...new Set(records.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a);
  const venues=[...new Set(records.map(x=>x.venue))].sort((a,b)=>a.localeCompare(b));
  for(const [id,name] of TOPICS)$("topic").append(new Option(name,id));
  for(const year of ys)$("year").append(new Option(String(year),String(year)));
  for(const venue of venues)$("venue").append(new Option(venue,venue));
}
function filtered(){
  const s=state(),words=clean(s.q).split(" ").filter(Boolean);
  const matches=all.filter(x=>
    (!s.topic||x.topics.includes(s.topic))&&(!s.year||String(x.year)===s.year)
    &&(!s.venue||x.venue===s.venue)&&(!s.abstract||x.abstractStatus===s.abstract)
    &&words.every(w=>x.search.includes(w)));
  if(s.sort==="oldest")matches.sort((a,b)=>a.year-b.year||a.title.localeCompare(b.title));
  else if(s.sort==="title")matches.sort((a,b)=>a.title.localeCompare(b.title));
  else matches.sort((a,b)=>b.year-a.year||a.title.localeCompare(b.title));
  return matches;
}
function renderChips(s){
 const c=$("chips");c.replaceChildren();
 for(const field of ["q","topic","year","venue","abstract"]){
  const v=s[field];if(!v)continue;
  const text=field==="topic"?NAME(v):field==="abstract"?(v==="stored"?"Author abstract stored privately":"Editorial only"):v;
  const b=node("button",text+" ×");b.type="button";b.setAttribute("aria-label","Remove "+text+" filter");
  b.addEventListener("click",()=>{$(field).value="";display=LIMIT;render();writeURL();$("q").focus();});c.append(b);
 }
}
function render(){
 const results=filtered(),s=state();
 $("count").textContent=results.length+" matching papers";
 $("scope-label").textContent="Showing "+Math.min(display,results.length)+" of "+results.length+" results · 396 V31 versions";
 renderChips(s);
 const group=document.createDocumentFragment();
 for(const x of results.slice(0,display)){
  const item=node("article",null,"item"),left=node("div"),actions=node("div",null,"actions");
  const info=node("small",(x.venue||"Unspecified venue")+" · "+(x.year||"Year unresolved")+" · V31 record "+String(x.index+1).padStart(3,"0"));
  const h=node("h3",x.title),tags=node("div",null,"tags");
  for(const topic of x.topics.slice(0,4)){
    const b=node("button",NAME(topic));b.type="button";b.setAttribute("aria-label","Filter by "+NAME(topic));
    b.addEventListener("click",()=>{$("topic").value=topic;display=LIMIT;render();writeURL();});
    tags.append(b);
  }
  const f=node("div",(x.firstAuthor?"First author: "+x.firstAuthor+" · ":"")
    +(x.abstractStatus==="editorial"?"Editorial-only synopsis in private V31 · ":"Author original stored in private V31 · ")
    +(x.code?"Linked code · ":"")+(x.curated?"Curated detail available":"Source-list bibliographic entry"),"fine");
  left.append(info,h,tags,f);
  const detail=node("button","Explore record →");detail.type="button";
  detail.addEventListener("click",()=>openRecord(x.index));
  actions.append(detail);
  if(x.originalSource){const a=node("a","Source link ↗");a.href=x.originalSource;a.target="_blank";a.rel="noopener noreferrer";actions.append(a);}
  item.append(left,actions);group.append(item);
 }
 $("papers").replaceChildren(group);
 $("none").hidden=results.length>0;
 $("more").hidden=results.length<=display;
 $("more").textContent="Load more papers ("+Math.min(LIMIT,results.length-display)+" next) ↓";
}
function link(parent,url,label){
 if(!safeLink(url))return;
 const a=node("a",label);a.href=url;a.rel="noopener noreferrer";a.target="_blank";parent.append(a);
}
function openRecord(index,fromHistory=false){
 const x=all[index];if(!x)return;
 const dialog=$("detail"),body=$("detail-body");body.replaceChildren();
 lastFocus=document.activeElement;
 const section=node("div",null,"detail-content");
 section.append(node("div",(x.venue||"Unknown venue")+" · "+(x.year||"Unknown year")+" · V31 #"+(x.index+1),"record-top"));
 const h=node("h2",x.title);h.id="detail-title";section.append(h);
 const tags=node("div",null,"tags");
 for(const t of x.topics)tags.append(node("span",NAME(t)));section.append(tags);
 const grid=node("div",null,"factgrid");
 for(const [key,value] of [["Research areas",x.topics.length],["Abstract status",x.abstractStatus==="editorial"?"Editorial synopsis only":"Original in private V31"],["Source",x.originalSource?"Listed upstream":"Link missing"],["Code",x.code?"Linked":"Not indexed"]]){
  const box=node("div");box.append(node("span",key),node("strong",value));grid.append(box);
 }
 section.append(grid);
 const caution=node("p","This is a bibliographic source-list entry. Many V31 topics were assigned automatically and have not been independently reviewed. Abstract source coverage describes the user's local V31 archive; no original abstract is mirrored on this public page.","warning");
 section.append(caution);
 const links=node("div",null,"detail-links");
 link(links,x.originalSource,"Read original source ↗");link(links,x.code,"View linked code ↗");
 if(x.curated)link(links,new URL("../papers/"+x.curated+"/",location.href).href,"Open curated scientific record →");
 section.append(links);
 if(x.workPartner>=0){
  const rel=node("div",null,"relation");
  rel.append(node("strong","Version family: "));
  rel.append(node("span","V31 links this bibliographic version with one other record for the same research work. "));
  const b=node("button","Open related version →");b.type="button";b.addEventListener("click",()=>openRecord(x.workPartner));rel.append(b);section.append(rel);
 }
 section.append(node("h3","Authorship and evidence"));
 section.append(node("p",x.firstAuthor?"First author indexed by V31: "+x.firstAuthor+". Additional author names and author–affiliation relationships should be checked against the linked publication.":"Author list has not been imported for this public metadata entry."));
 section.append(node("h3","Scope and citation"));
 section.append(node("p","For complete author listings, independently written synopses and any locally stored abstracts, consult the supplied V31 personal research database. For publication details, consult the linked publisher or source. No task-level result has been reproduced by SNNCommunity for this indexed entry."));
 body.append(section);
 if(!dialog.open)dialog.showModal();
 selected=index;
 if(!fromHistory)writeURL("push",index);
}
function closeRecord(write=true){
 const d=$("detail");if(d.open)d.close();
 selected=-1;
 if(write)writeURL("replace",-1);
 if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
}
async function copySearch(){
 const u=new URL(location.pathname,location.origin),s=state();
 for(const k of FIELDS)if(s[k]&&!(k==="sort"&&s[k]==="recent"))u.searchParams.set(k,s[k]);
 u.hash="results";
 try{await navigator.clipboard.writeText(u.href);$("announce").textContent="Clean research search link copied.";}
 catch{window.prompt("Copy research link:",u.href);}
}
function initHandlers(){
 for(const key of FIELDS){
  const e=$(key);
  e.addEventListener(key==="q"?"input":"change",()=>{
   display=LIMIT;render();writeURL(key==="q"?"replace":"push");
  });
 }
 $("reset").addEventListener("click",()=>{
  for(const f of FIELDS)$(f).value=f==="sort"?"recent":"";
  display=LIMIT;render();writeURL();$("q").focus();
 });
 $("more").addEventListener("click",()=>{display+=LIMIT;render();});
 $("share").addEventListener("click",copySearch);
 $("close").addEventListener("click",()=>closeRecord());
 $("detail").addEventListener("close",()=>{if(selected>=0)closeRecord();});
 window.addEventListener("popstate",()=>{parseURL();display=LIMIT;render();const id=Number(new URLSearchParams(location.search).get("record"));const raw=new URLSearchParams(location.search).get("record");if(raw!==null&&Number.isInteger(id)&&id>=0&&id<all.length)openRecord(id,true);else if($("detail").open)closeRecord(false);});
}
async function load(){
 const [ra,rb,rc]=await Promise.all([fetch("./corpus.json"),fetch("./metadata.json"),fetch("../resources.json")]);
 if(!ra.ok||!rb.ok)throw Error("Corpus metadata unavailable");
 const [corpus,meta]=await Promise.all([ra.json(),rb.json()]);
 if(corpus.recordCount!==396||corpus.records.length!==396||meta.bitmasks.length!==396||meta.firstAuthors.length!==396||meta.editorialOnlyIndices.length!==24||meta.distinctWorkCount!==395)throw Error("V31 data integrity mismatch");
 if(rc.ok){
  const old=await rc.json();
  for(const p of old.items.filter(x=>x.type==="paper"))curated.set(clean(p.title),p.id);
 }
 all=corpus.records.map((row,i)=>rowData(row,i,meta.bitmasks[i],meta));
 for(const x of all)x.search=clean([x.title,x.firstAuthor,x.venue,...x.topics.map(NAME)].join(" "));
 populate(all);parseURL();initHandlers();render();
 const raw=new URLSearchParams(location.search).get("record");
 if(raw!==null&&Number.isInteger(Number(raw))&&+raw>=0&&+raw<all.length)openRecord(+raw,true);
}
load().catch(e=>{console.error("V31 Atlas:",e);$("count").textContent="Could not load the V31 research index";$("error").hidden=false;});
