/* One public 395-work bibliography. Software and guides live in /ecosystem/. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const research=window.SNNResearch;
if(!research)throw Error("Shared research index is unavailable");
const normalize=research.normalize;
const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
const link=(url,label,cls)=>{if(!/^https:\/\//i.test(url||""))return null;const a=make("a",cls,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const fields=["year","venue","source","code","sort"];
const opts={year:"atlas-year",venue:"atlas-venue",source:"atlas-source",code:"atlas-code",sort:"atlas-sort"};
const topicBar=$("atlas-topics"),grid=$("resource-grid"),count=$("resource-count");
const minView=8,pageSize=20;
let papers=[],topics=[],selected=new Set(),mode="any",limit=minView;
const label=id=>topics.find(t=>t.id===id)?.label||id;
const names=()=>new Map(topics.map(t=>[t.id,[t.label,...(t.aliases||[])].join(" ")]));
function current(){
 return {query:$("resource-search").value.trim(),topics:[...selected],mode,
  ...Object.fromEntries(fields.map(k=>[k,$(opts[k]).value]))};
}
function filter(skipTopics=false){
 const q=current();
 return {query:q.query,topics:skipTopics?[]:q.topics,mode:q.mode,year:q.year,venue:q.venue,source:q.source,code:q.code,sort:q.sort};
}
const matching=()=>research.filterWorks(papers,filter(),names());
function atlasURL(id=null){
 const u=new URL("./atlas/",location.href),f=current();
 if(f.query)u.searchParams.set("q",f.query);
 if(f.topics.length===1)u.searchParams.set("topic",f.topics[0]);
 else if(f.topics.length>1){
  u.searchParams.set("topics",f.topics.sort().join(","));
  if(f.mode==="all")u.searchParams.set("mode","all");
 }
 for(const k of ["year","venue","source","code"])if(f[k]!=="all")u.searchParams.set(k,f[k]);
 if(f.sort!=="recent")u.searchParams.set("sort",f.sort);
 if(id)u.searchParams.set("paper",id);
 u.hash="results";
 return u.pathname+u.search+u.hash;
}
function topicButtons(){
 const counts=research.topicCounts(papers,filter(true),names()).counts;
 const total=research.filterWorks(papers,filter(true),names()).length;
 const fragment=document.createDocumentFragment();
 for(const [id,text,n] of [["all","All research",total],...topics.map(t=>[t.id,t.label,counts.get(t.id)||0])]){
  const active=id==="all"?!selected.size:selected.has(id);
  const button=make("button","atlas-topic"+(active?" is-selected":""),text);
  button.type="button";button.dataset.topic=id;button.setAttribute("aria-pressed",String(active));
  button.setAttribute("aria-label",text+" · "+n+" results in the research library");
  button.append(make("span","atlas-topic-count",n));
  button.addEventListener("click",()=>{
   if(id==="all")selected.clear();
   else if(selected.has(id))selected.delete(id);else selected.add(id);
   limit=minView;render();setUrl("push");
  });
  fragment.append(button);
 }
 topicBar.replaceChildren(fragment);
}
function paperCard(x){
 const card=make("article","resource-card atlas-card");
 const head=make("div","resource-card-head");
 head.append(make("span","resource-label","RESEARCH WORK"));
 head.append(make("span","atlas-venue-label",(x.venue||"Venue pending")+" · "+(x.year||"Year unverified")));
 const h=make("h3"),a=make("a","atlas-title-link",research.displayTitle(x.title));
 a.href=atlasURL(x.id);h.append(a);
 const summary=make("div","atlas-card-summary");
 summary.append(make("span","atlas-authors",(x.authors?.[0]||"Author pending")+(x.authorCount>1?" et al. · "+x.authorCount+" authors":"")));
 if(x.doi&&/^10\./.test(x.doi)){const doi=link("https://doi.org/"+x.doi,"DOI · "+x.doi,"atlas-affiliation-hint");if(doi)summary.append(doi);}
 const excerpt=make("p",null,research.sourceLabel(x.sourceStatus)+(x.versionCount>1?" · Publication history linked":""));
 const tags=make("div","atlas-card-topics");
 for(const topic of (x.topics||[]).slice(0,4))tags.append(make("span","atlas-tag",label(topic)));
 const details=make("details","resource-evidence"),inner=make("div","resource-evidence-body");
 details.append(make("summary",null,"Source details"));
 if(x.sourceWarnings)inner.append(make("p","resource-review","Source or identity warning: check the publication before citing."));
 if(x.versionCount>1)inner.append(make("p","resource-review","The preprint and published version appear under one paper."));
 if(x.editorialSourceChecked20261014)inner.append(make("p","resource-review","Source checked in the October 2026 bibliography."));
 if(!inner.childNodes.length)inner.append(make("p","resource-review","Link type: "+research.sourceLabel(x.sourceStatus)+"."));
 details.append(inner);
 const actions=make("div","atlas-card-actions");
 const record=make("a","atlas-record-link","Research record →");record.href=atlasURL(x.id);actions.append(record);
 const publication=link(x.paperUrl,"Indexed publication / venue ↗","resource-main-link");if(publication)actions.append(publication);
 const code=link(x.codeUrl,"Original code ↗","resource-main-link");if(code)actions.append(code);
 if(x.curatedId){const curated=make("a","atlas-curated-link","Curated method notes →");
  curated.href="./papers/"+encodeURIComponent(x.curatedId)+"/";actions.append(curated);}
 card.append(head,h,summary,excerpt,tags,details,actions);
 return card;
}
function chips(){
 const fragment=document.createDocumentFragment();
 const add=(text,remove)=>{
  const b=make("button","atlas-active-chip",text+" ×");b.type="button";
  b.addEventListener("click",()=>{remove();limit=minView;render();setUrl("push");});fragment.append(b);
 };
 for(const t of selected)add(label(t),()=>selected.delete(t));
 const query=$("resource-search").value.trim();if(query)add("Search: "+query,()=>$("resource-search").value="");
 if(mode==="all"&&selected.size)add("Require all topics",()=>{$("atlas-topic-mode").value="any";mode="any";});
 for(const k of ["year","venue","source","code"]){
  const el=$(opts[k]);
  if(el.value!=="all")add(el.selectedOptions[0]?.textContent||el.value,()=>el.value="all");
 }
 if(!fragment.childNodes.length)fragment.append(make("span","atlas-active-idle","Browsing the 395-work research library."));
 $("atlas-active-filters").replaceChildren(fragment);
}
function render(){
 for(const a of document.querySelectorAll("[data-full-atlas-link]"))a.href=atlasURL();
 const matches=matching();topicButtons();chips();
 const quick=$("atlas-code-quick");
 const codeOnly=$(opts.code).value==="yes";
 quick.setAttribute("aria-pressed",String(codeOnly));
 quick.textContent=codeOnly?"Show all indexed papers ↗":"Show papers with code ↗";
 grid.replaceChildren(...matches.slice(0,limit).map(paperCard));
 count.textContent="Showing "+Math.min(limit,matches.length)+" of "+matches.length+" papers";
 $("resource-empty").hidden=matches.length!==0;
 const more=$("resource-more");more.hidden=matches.length<=minView;
 more.setAttribute("aria-expanded",String(limit>=matches.length));
 more.textContent=limit>=matches.length?"Show fewer results ↑":"Load "+Math.min(pageSize,matches.length-limit)+" more results ↓";
}
function searchURL(clean=false){
 const u=clean?new URL(location.pathname,location.origin):new URL(location.href);
 if(clean)u.hash="#library";
 for(const [k] of [...u.searchParams])if(k.startsWith("atlas."))u.searchParams.delete(k);
 const q=current();
 if(q.query)u.searchParams.set("atlas.query",q.query);
 if(q.topics.length)u.searchParams.set("atlas.topic",q.topics.sort().join(","));
 if(q.mode==="all"&&q.topics.length)u.searchParams.set("atlas.mode","all");
 for(const k of ["year","venue","source","code"])if(q[k]!=="all")u.searchParams.set("atlas."+k,q[k]);
 if(q.sort!=="recent")u.searchParams.set("atlas.sort",q.sort);
 return u;
}
function setUrl(how){
 const u=searchURL();
 if(u.href!==location.href)history[how==="replace"?"replaceState":"pushState"](null,"",u);
}
function loadURL(){
 const q=new URLSearchParams(location.search);
 // Historical homepage software deep links now have a dedicated destination.
 if(q.get("atlas.format")==="resource"){location.replace("./ecosystem/");return;}
 selected=new Set((q.get("atlas.topic")||"").split(",").filter(t=>topics.some(x=>x.id===t)));
 mode=q.get("atlas.mode")==="all"?"all":"any";
 $("atlas-topic-mode").value=mode;
 $("resource-search").value=q.get("atlas.query")||"";
 for(const k of fields){
  const el=$(opts[k]),wanted=q.get("atlas."+k)||(k==="sort"?"recent":"all");
  el.value=[...el.options].some(o=>o.value===wanted)?wanted:k==="sort"?"recent":"all";
 }
 limit=minView;render();
}
function fill(select,values){
 for(const option of [...select.options].slice(1))option.remove();
 for(const value of values)select.add(new Option(String(value),String(value)));
}
async function load(){
 const [worksResponse,catalogResponse]=await Promise.all([fetch("./atlas/works.json"),fetch("./resources.json")]);
 if(!worksResponse.ok||!catalogResponse.ok)throw Error("Unable to load research source metadata");
 const works=research.validate(await worksResponse.json()),catalog=await catalogResponse.json();
 if(!Array.isArray(catalog.items)||!Array.isArray(catalog.topics))throw Error("Invalid research reference catalog");
 const curated=new Map(catalog.items.filter(x=>x.type==="paper").map(x=>[normalize(x.title),x.id]));
 papers=works.items.map(x=>({...x,curatedId:curated.get(normalize(x.title))||null}));
 topics=catalog.topics;
 $("coverage-total").textContent=String(papers.length);
 $("coverage-code").textContent=String(papers.filter(x=>x.codeUrl).length);
 $("coverage-doi").textContent=String(papers.filter(x=>x.doi).length);
 fill($("atlas-year"),[...new Set(papers.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a));
 fill($("atlas-venue"),[...new Set(papers.map(x=>x.venue).filter(Boolean))].sort((a,b)=>a.localeCompare(b)));
 $("atlas-code-quick").addEventListener("click",()=>{
  $(opts.code).value=$(opts.code).value==="yes"?"all":"yes";
  limit=minView;render();setUrl("push");
 });
 for(const k of fields)$(opts[k]).addEventListener("change",()=>{limit=minView;render();setUrl("push");});
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
  const url=searchURL(true).href;
  try{await navigator.clipboard.writeText(url);$("atlas-copy-fallback").hidden=true;$("atlas-copy-status").textContent="Research search link copied.";}
  catch{$("atlas-copy-input").value=url;$("atlas-copy-fallback").hidden=false;$("atlas-copy-input").select();$("atlas-copy-status").textContent="Copy the selected URL.";}
 });
 window.addEventListener("popstate",loadURL);
 if(window.matchMedia("(max-width:680px)").matches)$("atlas-advanced").open=false;
 loadURL();
}
load().catch(e=>{console.error("Research index:",e);count.textContent="Research catalog unavailable";$("resource-fallback").hidden=false;});
})();
