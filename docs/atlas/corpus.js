const $=id=>document.getElementById(id);
const TOPICS=[
 ["neuron-dynamics","Neuron dynamics"],["learning-plasticity","Learning & plasticity"],
 ["deep-architectures","Deep architectures"],["coding-conversion","Coding & conversion"],
 ["efficiency-hardware","Efficiency & hardware"],["event-vision","Event-based vision"],
 ["robotics-embodied","Robotics & embodied AI"],["sequence-language","Sequence & language"],
 ["neuroscience-bci","Neuroscience & BCI"],["benchmarks-tools","Benchmarks & tools"],
 ["theory-robustness","Theory & robustness"]
];
const FIELDS=["q","topic","year","venue","unit","source","code","abstract","sort"];
const LIMIT=24,NAME=id=>TOPICS.find(t=>t[0]===id)?.[1]||id;
const clean=s=>String(s??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
const safeLink=url=>typeof url==="string"&&/^https:\/\//i.test(url)?url:null;
const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!=null)n.textContent=String(text);if(className)n.className=className;return n;};
let all=[],display=LIMIT,selected=-1,curated=new Map(),lastFocus=null;
let privateLibrary=null;
const sourceLabel=kind=>kind==="specific"?"Publisher-specific page (source-listed)":kind==="index"?"Conference index / aggregate":"Paper-specific page unresolved";
function isBitSet(hex,i){const s=String(hex||"");const pos=s.length-1-Math.floor(i/4);return pos>=0&&((parseInt(s[pos],16)>>(i%4))&1)===1}
function sourceKind(packed,i){
 const byte=parseInt(packed.slice(2*Math.floor(i/4),2*Math.floor(i/4)+2),16);
 return ["unresolved","index","specific"][(byte>>(2*(i%4)))&3]||"unresolved";
}
const normTitle=s=>clean(s).replace(/[^a-z0-9]/g,"");
function relatedPrivate(record){return privateLibrary?.papers?.[record.index]||null}
function state(){
  return Object.fromEntries(FIELDS.map(k=>[k,($(k==="q"?"q":k)?.value||"")]));
}
function parseURL(){
  const u=new URL(location.href);
  for(const k of FIELDS){
    const el=$(k);let v=u.searchParams.get(k)||"";
    if(k==="sort")v=v||"recent";if(k==="unit")v=v||"versions";
    el.value=k==="q"?v:([...(el.options||[])].some(o=>o.value===v)?v:k==="sort"?"recent":k==="unit"?"versions":"");
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
  return {index:i,title,year:Object.prototype.hasOwnProperty.call(meta.yearOverrides||{},i)
      ?Number(meta.yearOverrides[i])||0:Number(sectionYear)||0,venue:(venueText||"").replace(/\s*20\d{2}\s*$/,"").trim()||"Unspecified",
    originalSource:safeLink(paper||meta.sourceFallback?.[i]),code:safeLink(code),topics,
    firstAuthor:meta.firstAuthors?.[i]||"",doi:meta.doiAsProvided?.[i]||"",
    authorCount:parseInt(meta.authorCountsBase36?.[i]||"0",36),
    sourceType:sourceKind(meta.sourceSpecificityPacked,i),
    hasWarnings:isBitSet(meta.warningFlagsHex,i),
    limitedBibliographyReview:isBitSet(meta.limitedBibliographyReviewHex,i),
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
  let matches=all.filter(x=>
    (!s.topic||x.topics.includes(s.topic))&&(!s.year||String(x.year)===s.year)
    &&(!s.venue||x.venue===s.venue)&&(!s.abstract||x.abstractStatus===s.abstract)
    &&(!s.source||x.sourceType===s.source)
    &&(!s.code||(s.code==="yes"?Boolean(x.code):!x.code))
    &&words.every(w=>x.search.includes(w)));
  if(s.unit==="works"){
    const used=new Set();
    matches=matches.filter(x=>{
      const group=x.workPartner>=0?Math.min(x.index,x.workPartner):x.index;
      if(used.has(group))return false;used.add(group);return true;
    });
  }
  if(s.sort==="oldest")matches.sort((a,b)=>(a.year||9999)-(b.year||9999)||a.title.localeCompare(b.title));
  else if(s.sort==="title")matches.sort((a,b)=>a.title.localeCompare(b.title));
  else matches.sort((a,b)=>(b.year||-1)-(a.year||-1)||a.title.localeCompare(b.title));
  return matches;
}
function renderChips(s){
 const c=$("chips");c.replaceChildren();
 for(const field of ["q","topic","year","venue","unit","source","code","abstract"]){
  const v=s[field];if(!v)continue;
  const text=field==="topic"?NAME(v):field==="abstract"?(v==="stored"?"Author abstract stored privately":"Editorial only")
    :field==="source"?sourceLabel(v):field==="unit"?(v==="works"?"Distinct works":"Bibliographic versions")
    :field==="code"?(v==="yes"?"Code linked":"Code not indexed"):v;
  const b=node("button",text+" ×");b.type="button";b.setAttribute("aria-label","Remove "+text+" filter");
  b.addEventListener("click",()=>{$(field).value="";display=LIMIT;render();writeURL();$("q").focus();});c.append(b);
 }
}
function render(){
 const results=filtered(),s=state();
 $("count").textContent=results.length+(s.unit==="works"?" matching research works":" matching papers");
 $("scope-label").textContent="Showing "+Math.min(display,results.length)+" of "+results.length+
   (s.unit==="works"?" work entries · 395 independent works":" bibliographic versions · 396 total versions");
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
  const preview=relatedPrivate(x);
  if(preview?.abstractSummaryZh){
    const summary=node("p",preview.abstractSummaryZh,"zh-preview");
    summary.lang="zh-CN";left.append(summary);
  }
  const f=node("div",(x.firstAuthor?"First author: "+x.firstAuthor+(x.authorCount>1?" (of "+x.authorCount+" authors)":"")+" · ":"")
    +(x.abstractStatus==="editorial"?"Editorial-only synopsis in private V31 · ":"Author original stored in private V31 · ")
    +(x.doi?"DOI listed · ":"")+(x.code?"Linked code · ":"")
    +sourceLabel(x.sourceType)+" · "+(x.curated?"Curated detail available":"Source-list bibliographic entry"),"fine");
  left.append(info,h,tags,f);
  const detail=node("button",preview?"Read research abstract →":"Explore record →");detail.type="button";
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
 for(const [key,value] of [["Research areas",x.topics.length],["Abstract status",x.abstractStatus==="editorial"?"Editorial synopsis only":"Original in private V31"],["Source",x.originalSource?"Listed upstream":"Link missing"],["Code",x.code?"Linked":"Not indexed"],["DOI",x.doi||"Not indexed"],
 ["Authors",x.authorCount+" indexed in V31"],["Source detail",sourceLabel(x.sourceType)]]){
  const box=node("div");box.append(node("span",key),node("strong",value));grid.append(box);
 }
 section.append(grid);
 const caution=node("p","This is a bibliographic source-list entry. Many V31 topics were assigned automatically and have not been independently reviewed. Abstract source coverage describes the user's local V31 archive; no original abstract is mirrored on this public page.","warning");
 section.append(caution);
 if(x.hasWarnings){
   section.append(node("p","V31 flags one or more source or identity warnings for this version. Verify publication identity before citing it.","warning"));
 }
 const privateRecord=relatedPrivate(x);
 if(privateRecord){
   const authorNames=(privateRecord.authors||[]).map(a=>a.displayName).filter(Boolean);
   if(authorNames.length){
     section.append(node("h3","Authors · V31 local database"));
     section.append(node("p",authorNames.join(", ")));
   }
   if(privateRecord.abstractDisplayText){
     const aType=privateRecord.abstractDisplayType==="stored_author_abstract"
       ?"Author-original abstract · locally stored":"Independent editorial research synopsis · not an author's abstract";
     section.append(node("h3",aType));
     const para=node("p",privateRecord.abstractDisplayText,"local-abstract");para.lang="en";section.append(para);
     section.append(node("p","This text is read from your locally selected JSON only; it is not part of the public website database.","local-disclosure"));
   }
   if(privateRecord.abstractSummaryZh){
     const zh=node("p",privateRecord.abstractSummaryZh,"local-abstract");zh.lang="zh-CN";
     section.append(node("h3","中文研究要点 · 本地 V31 编辑摘要"));section.append(zh);
   }
   const src=privateRecord.abstractDisplaySource||privateRecord.abstractOriginalSource;
   if(safeLink(src)){const cite=node("div",null,"detail-links");link(cite,src,"Check abstract source ↗");section.append(cite);}
 }
 const links=node("div",null,"detail-links");
 link(links,x.originalSource,"Read source-listed publication ↗");
 if(x.doi&&!/\/full$/i.test(x.doi))link(links,"https://doi.org/"+x.doi,"Resolve source-listed DOI ↗");
 link(links,x.code,"View linked code ↗");
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
  for(const f of FIELDS)$(f).value=f==="sort"?"recent":f==="unit"?"versions":"";
  display=LIMIT;render();writeURL();$("q").focus();
 });
 $("more").addEventListener("click",()=>{display+=LIMIT;render();});
 $("share").addEventListener("click",copySearch);
 $("private-file").addEventListener("change",async event=>{
   const file=event.target.files?.[0];if(!file)return;
   const status=$("private-status");
   try{
     if(file.size>40*1024*1024)throw Error("File is unexpectedly large (over 40 MB).");
     const content=JSON.parse(await file.text());
     if(!Array.isArray(content.papers)||content.papers.length!==396)
       throw Error("Not a complete V31 corpus (396 records expected).");
     const same=content.papers.reduce((sum,p,i)=>sum+(normTitle(p.title)===normTitle(all[i].title)?1:0),0);
     if(same<390)throw Error("The selected V31 data do not match the current source snapshot.");
     privateLibrary={papers:content.papers};
     $("private-clear").hidden=false;
     status.textContent="Local V31 loaded: 396 records and "+same+" aligned titles. Full authors and local abstracts are available. No file was uploaded.";
     render();
     if(selected>=0)openRecord(selected,true);
   }catch(e){
     privateLibrary=null;$("private-clear").hidden=true;
     status.textContent="Local import failed: "+e.message+" No private data loaded.";
     render();
   }
 });
 $("private-clear").addEventListener("click",()=>{
   privateLibrary=null;$("private-file").value="";$("private-clear").hidden=true;
   $("private-status").textContent="Private V31 unloaded. Public metadata browsing restored.";
   render();if(selected>=0)openRecord(selected,true);
 });
 $("close").addEventListener("click",()=>closeRecord());
 $("detail").addEventListener("close",()=>{if(selected>=0)closeRecord();});
 window.addEventListener("popstate",()=>{parseURL();display=LIMIT;render();const id=Number(new URLSearchParams(location.search).get("record"));const raw=new URLSearchParams(location.search).get("record");if(raw!==null&&Number.isInteger(id)&&id>=0&&id<all.length)openRecord(id,true);else if($("detail").open)closeRecord(false);});
}
async function load(){
 const [ra,rb,rc]=await Promise.all([fetch("./corpus.json"),fetch("./metadata.json"),fetch("../resources.json")]);
 if(!ra.ok||!rb.ok)throw Error("Corpus metadata unavailable");
 const [corpus,meta]=await Promise.all([ra.json(),rb.json()]);
 if(corpus.recordCount!==396||corpus.records.length!==396||meta.bitmasks.length!==396||
   meta.firstAuthors.length!==396||meta.authorCountsBase36?.length!==396||meta.sourceSpecificityPacked?.length!==198||
   meta.editorialOnlyIndices.length!==24||meta.distinctWorkCount!==395)throw Error("V31 data integrity mismatch");
 if(rc.ok){
  const old=await rc.json();
  for(const p of old.items.filter(x=>x.type==="paper"))curated.set(clean(p.title),p.id);
 }
 all=corpus.records.map((row,i)=>rowData(row,i,meta.bitmasks[i],meta));
 for(const x of all)x.search=clean([x.title,x.firstAuthor,x.doi,x.venue,...x.topics.map(NAME)].join(" "));
 populate(all);parseURL();initHandlers();render();
 const raw=new URLSearchParams(location.search).get("record");
 if(raw!==null&&Number.isInteger(Number(raw))&&+raw>=0&&+raw<all.length)openRecord(+raw,true);
}
load().catch(e=>{console.error("V31 Atlas:",e);$("count").textContent="Could not load the V31 research index";$("error").hidden=false;});
