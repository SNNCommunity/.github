/* SNNCommunity homepage: one canonical 395-work source, no duplicate local paper database. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const research=window.SNNResearch;
if(!research)throw Error("Shared research index is unavailable");
const normalize=research.normalize;
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const link=(url,label,cls)=>{if(!/^https:\/\//i.test(url||""))return null;
 const a=make("a",cls,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const fields=["year","venue","source","code","sort"];
const opts={year:"atlas-year",venue:"atlas-venue",source:"atlas-source",code:"atlas-code",sort:"atlas-sort"};
const topicBar=$("atlas-topics"),grid=$("resource-grid"),count=$("resource-count");
let papers=[],resources=[],topics=[],selected=new Set(),mode="any",kind="paper",limit=8;
const minView=8,pageSize=20;
const topicLabel=id=>topics.find(t=>t.id===id)?.label||id;
function dedicatedURL(id=null){
 const u=new URL("./atlas/",location.href),f=current();
 if(f.kind==="paper"){
   if(f.query)u.searchParams.set("q",f.query);
   if(f.topics.length===1)u.searchParams.set("topic",f.topics[0]);
   else if(f.topics.length>1){
     u.searchParams.set("topics",[...f.topics].sort().join(","));
     if(f.mode==="all")u.searchParams.set("mode","all");
   }
   for(const k of ["year","venue","source","code"])if(f[k]!=="all")u.searchParams.set(k,f[k]);
   if(f.sort!=="recent")u.searchParams.set("sort",f.sort);
 }
 if(id)u.searchParams.set("paper",id);
 u.hash="results";
 return u.pathname+u.search+u.hash;
}
const statusLabel=research.sourceLabel;
const topicNames=()=>new Map(topics.map(x=>[x.id,x.label]));
const workFilters=skipTopics=>{const f=current();return {query:f.query,topics:skipTopics?[]:f.topics,mode:f.mode,year:f.year,venue:f.venue,source:f.source,code:f.code,sort:f.sort};};
function current(){
 return {kind,query:$("resource-search").value.trim(),topics:[...selected],mode,
  ...Object.fromEntries(fields.map(k=>[k,$(opts[k]).value]))};
}
const source=()=>kind==="paper"?papers:resources;
function searchText(x){
 if(kind==="paper")return normalize([x.title,...(x.authors||[]),x.doi,x.year,x.venue,...x.topics.map(topicLabel)].filter(Boolean).join(" "));
 return normalize([x.title,x.description,x.publisher,...x.topics.map(topicLabel),...(x.searchAliases||[])].filter(Boolean).join(" "));
}
function baseCandidates(disableTopics=false){
 if(kind==="paper")return research.filterWorks(papers,workFilters(disableTopics),topicNames());
 const q=current(),words=normalize(q.query).split(" ").filter(Boolean);
 return source().filter(x=>{
   const ts=x.topics||[];
   if(!disableTopics&&q.topics.length&&(q.mode==="all"?!q.topics.every(t=>ts.includes(t)):!q.topics.some(t=>ts.includes(t))))return false;
   if(kind==="paper"){
     if(q.year!=="all"&&String(x.year)!==q.year)return false;
     if(q.venue!=="all"&&x.venue!==q.venue)return false;
     if(q.source!=="all"&&x.sourceStatus!==q.source)return false;
     if(q.code!=="all"&&(q.code==="yes"?!x.codeUrl:!!x.codeUrl))return false;
   }
   const text=searchText(x);return words.every(w=>text.includes(w));
 });
}
function matching(){
 if(kind==="paper")return research.filterWorks(papers,workFilters(false),topicNames());
 const data=baseCandidates();
 const sort=$(opts.sort).value;
 data.sort((a,b)=>sort==="title"?a.title.localeCompare(b.title):
   sort==="oldest"?(a.year||9999)-(b.year||9999)||a.title.localeCompare(b.title):
   (b.year||-1)-(a.year||-1)||a.title.localeCompare(b.title));
 return data;
}
function syncTopics(){
 const cands=baseCandidates(true),counts=new Map();
 if(kind==="paper")for(const [t,n] of research.topicCounts(papers,workFilters(true),topicNames()).counts)counts.set(t,n);
 else for(const x of cands)for(const t of x.topics||[])counts.set(t,(counts.get(t)||0)+1);
 const fragment=document.createDocumentFragment();
 for(const [id,labelText,n] of [["all",kind==="paper"?"All research":"All tools",cands.length],...topics.map(t=>[t.id,t.label,counts.get(t.id)||0])]){
   const b=make("button","atlas-topic"+(id==="all"?!selected.size?" is-selected":"":selected.has(id)?" is-selected":""),labelText);
   b.type="button";b.dataset.topic=id;b.setAttribute("aria-pressed",String(id==="all"?!selected.size:selected.has(id)));
   b.setAttribute("aria-label",labelText+" · "+n+" results in current "+(kind==="paper"?"paper":"software")+" collection");
   b.append(make("span","atlas-topic-count",n));
   b.addEventListener("click",()=>{
     if(id==="all")selected.clear();
     else if(selected.has(id))selected.delete(id);else selected.add(id);
     limit=minView;render();setUrl("push");
   });
   fragment.append(b);
 }
 topicBar.replaceChildren(fragment);
}
function showPaper(x){
 const card=make("article","resource-card atlas-card");
 const head=make("div","resource-card-head");
 head.append(make("span","resource-label","RESEARCH WORK"));
 head.append(make("span","atlas-venue-label",(x.venue||"Venue pending")+" · "+(x.year||"Year unverified")));
 const h=make("h3");const title=make("a","atlas-title-link",x.title);
 title.href=dedicatedURL(x.id);h.append(title);
 const summary=make("div","atlas-card-summary");
 summary.append(make("span","atlas-authors",(x.authors?.[0]||"Author pending")+(x.authorCount>1?" et al. · "+x.authorCount+" indexed contributors":"")));
 if(x.doi)summary.append(make("span","atlas-affiliation-hint","DOI · "+x.doi));
 const excerpt=make("p",null,statusLabel(x.sourceStatus)+(x.versionCount>1?" · Preprint and publication linked":"")+(x.codeUrl?" · Code link available":""));
 const tags=make("div","atlas-card-topics");
 for(const t of (x.topics||[]).slice(0,4))tags.append(make("span","atlas-tag",topicLabel(t)));
 const evidence=make("details","resource-evidence");
 evidence.append(make("summary",null,"Source details"));
 const inner=make("div","resource-evidence-body");
 if(x.sourceWarnings)inner.append(make("p","resource-review","Source or identity warning: check the publication before citing."));
 if(x.versionCount>1)inner.append(make("p","resource-review","The preprint and published version appear under one paper."));
 if(x.editorialSourceChecked20261014)inner.append(make("p","resource-review","Source checked in the October 2026 bibliography."));
 if(!inner.childNodes.length)inner.append(make("p","resource-review","Link type: "+statusLabel(x.sourceStatus)+"."));
 evidence.append(inner);
 const actions=make("div","atlas-card-actions");
 const record=make("a","atlas-record-link","Research record →");record.href=dedicatedURL(x.id);
 actions.append(record);
 const sourceLink=link(x.paperUrl,"Indexed publication / venue ↗","resource-main-link");if(sourceLink)actions.append(sourceLink);
 const codeLink=link(x.codeUrl,"Original code ↗","resource-main-link");if(codeLink)actions.append(codeLink);
 if(x.curatedId){const curated=make("a","atlas-curated-link","Curated method notes →");
   curated.href="./papers/"+encodeURIComponent(x.curatedId)+"/";actions.append(curated);}
 card.append(head,h,summary,excerpt,tags,evidence,actions);return card;
}
function showResource(x){
 const card=make("article","resource-card atlas-card");
 const head=make("div","resource-card-head");
 head.append(make("span","resource-label","SOFTWARE / LEARNING"));
 const h=make("h3");h.append(make("span","atlas-title-link",x.title));
 const summary=make("div","atlas-card-summary",x.publisher||"Open community resource");
 const excerpt=make("p",null,x.description);
 const tags=make("div","atlas-card-topics");
 for(const t of x.topics||[])tags.append(make("span","atlas-tag",topicLabel(t)));
 const details=make("details","resource-evidence");
 details.append(make("summary",null,"About this resource"));
 const inner=make("div","resource-evidence-body",x.licenseNote||"See the linked project for documentation and licensing.");details.append(inner);
 const actions=make("div","atlas-card-actions");const a=link(x.url,"Open original resource ↗","resource-main-link");if(a)actions.append(a);
 card.append(head,h,summary,excerpt,tags,details,actions);return card;
}
function chips(){
 const wrap=$("atlas-active-filters"),f=document.createDocumentFragment();
 function add(value,remove){
   const btn=make("button","atlas-active-chip",value+" ×");btn.type="button";
   btn.addEventListener("click",()=>{remove();limit=minView;render();setUrl("push");});f.append(btn);
 }
 for(const t of selected)add(topicLabel(t),()=>selected.delete(t));
 const text=$("resource-search").value.trim();if(text)add("Search: "+text,()=>$("resource-search").value="");
 if(mode==="all"&&selected.size)add("Require all topics",()=>{$("atlas-topic-mode").value="any";mode="any";});
 if(kind==="paper")for(const key of ["year","venue","source","code"]){
   const el=$(opts[key]);if(el.value!=="all")add(el.selectedOptions[0]?.textContent||el.value,()=>el.value="all");
 }
 if(!f.childNodes.length)f.append(make("span","atlas-active-idle","Displaying the canonical "+(kind==="paper"?"395-work research library.":"9-resource tools and guides collection.")));
 wrap.replaceChildren(f);
}
function render(){
 for(const a of document.querySelectorAll("[data-full-atlas-link]"))a.href=kind==="paper"?dedicatedURL():"./atlas/";
 for(const tab of document.querySelectorAll(".atlas-kind")){
   const active=tab.dataset.format===kind;tab.classList.toggle("is-selected",active);
   tab.setAttribute("aria-pressed",String(active));
 }
 for(const el of document.querySelectorAll("[data-paper-facet]"))el.hidden=kind!=="paper";
 $("resource-search").placeholder=kind==="paper"?"Search 395 papers by title, author, DOI or topic…":"Search tools, libraries and learning resources…";
 const matches=matching();syncTopics();chips();
 const fragment=document.createDocumentFragment();
 for(const x of matches.slice(0,limit))fragment.append(kind==="paper"?showPaper(x):showResource(x));
 grid.replaceChildren(fragment);
 count.textContent="Showing "+Math.min(limit,matches.length)+" of "+matches.length+
   " "+(kind==="paper"?"papers":"tools and guides");
 $("resource-empty").hidden=matches.length>0;
 const more=$("resource-more");
 more.hidden=matches.length<=minView;more.setAttribute("aria-expanded",String(limit>=matches.length));
 more.textContent=limit>=matches.length?"Show fewer results ↑":"Load "+Math.min(pageSize,matches.length-limit)+" more results ↓";
}
function urls(clean=false){
 const u=clean?new URL(location.pathname,location.origin):new URL(location.href);
 if(clean)u.hash="#library";
 for(const [key] of [...u.searchParams])if(key.startsWith("atlas."))u.searchParams.delete(key);
 const q=current();
 if(q.kind!=="paper")u.searchParams.set("atlas.format",q.kind);
 if(q.query)u.searchParams.set("atlas.query",q.query);
 if(q.topics.length)u.searchParams.set("atlas.topic",q.topics.sort().join(","));
 if(q.mode==="all"&&q.topics.length)u.searchParams.set("atlas.mode","all");
 if(q.kind==="paper")for(const k of ["year","venue","source","code"]){
   if(q[k]!=="all")u.searchParams.set("atlas."+k,q[k]);
 }
 if(q.sort!=="recent")u.searchParams.set("atlas.sort",q.sort);
 return u;
}
function setUrl(how){const u=urls();if(u.href!==location.href)history[how==="replace"?"replaceState":"pushState"](null,"",u);}
function loadURL(){
 const q=new URLSearchParams(location.search);
 kind=q.get("atlas.format")==="resource"?"resource":"paper";
 selected=new Set((q.get("atlas.topic")||"").split(",").filter(t=>topics.some(x=>x.id===t)));
 mode=q.get("atlas.mode")==="all"?"all":"any";$("atlas-topic-mode").value=mode;
 $("resource-search").value=q.get("atlas.query")||"";
 for(const k of fields){
   const select=$(opts[k]);const v=q.get("atlas."+k)|| (k==="sort"?"recent":"all");
   select.value=[...select.options].some(x=>x.value===v)?v:k==="sort"?"recent":"all";
 }
 limit=minView;render();
}
function fill(select,values){
 for(const old of [...select.options].slice(1))old.remove();
 for(const value of values)select.add(new Option(String(value),String(value)));
}
async function load(){
 const [w,r]=await Promise.all([fetch("./atlas/works.json"),fetch("./resources.json")]);
 if(!w.ok||!r.ok)throw Error("Unable to load the canonical paper and tools indexes");
 const works=research.validate(await w.json()),catalog=await r.json();
 if(catalog.items?.filter(x=>x.type!=="paper").length!==9)throw Error("Invalid tool resource count");
 const cur=new Map(catalog.items.filter(x=>x.type==="paper").map(x=>[normalize(x.title),x.id]));
 papers=works.items.map(x=>({...x,curatedId:cur.get(normalize(x.title))||null}));
 resources=catalog.items.filter(x=>x.type!=="paper");
 topics=catalog.topics;
 fill($("atlas-year"),[...new Set(papers.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a));
 fill($("atlas-venue"),[...new Set(papers.map(x=>x.venue).filter(Boolean))].sort((a,b)=>a.localeCompare(b)));
 for(const b of document.querySelectorAll(".atlas-kind"))b.addEventListener("click",()=>{
   if(kind===b.dataset.format)return;
   kind=b.dataset.format;selected.clear();mode="any";$("atlas-topic-mode").value="any";$("resource-search").value="";
   for(const k of fields)$(opts[k]).value=k==="sort"?"recent":"all";
   limit=minView;render();setUrl("push");
 });
 for(const key of fields)$(opts[key]).addEventListener("change",()=>{limit=minView;render();setUrl("push");});
 $("atlas-topic-mode").addEventListener("change",e=>{mode=e.target.value;limit=minView;render();setUrl("push");});
 $("resource-search").addEventListener("input",()=>{limit=minView;render();setUrl("replace");});
 $("atlas-reset").addEventListener("click",()=>{
   selected.clear();mode="any";$("atlas-topic-mode").value="any";$("resource-search").value="";
   for(const k of fields)$(opts[k]).value=k==="sort"?"recent":"all";
   limit=minView;render();setUrl("push");$("resource-search").focus();
 });
 $("resource-more").addEventListener("click",()=>{
   const n=matching().length;limit=limit>=n?minView:Math.min(limit+pageSize,n);render();
 });
 $("atlas-copy").addEventListener("click",async()=>{
   const u=urls(true).href;
   try{await navigator.clipboard.writeText(u);$("atlas-copy-fallback").hidden=true;$("atlas-copy-status").textContent="Research search link copied.";}
   catch{$("atlas-copy-input").value=u;$("atlas-copy-fallback").hidden=false;$("atlas-copy-input").select();$("atlas-copy-status").textContent="Copy the selected URL.";}
 });
 window.addEventListener("popstate",loadURL);
 if(window.matchMedia("(max-width:680px)").matches)$("atlas-advanced").open=false;
 loadURL();
}
load().catch(e=>{console.error("Home research:",e);count.textContent="Research catalog unavailable";$("resource-fallback").hidden=false;});
})();
