/* Public 395-work discovery. One corpus and one atomic ontology shared with /atlas/. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const core=window.SNNResearch;if(!core)throw Error("Research core missing");
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=String(text);return n;};
const source=(url,label,cls)=>{if(!/^https:\/\//.test(url||""))return null;
 const a=node("a",cls,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const legacy={"neuron-dynamics":["D01"],"learning-plasticity":["D03"],"deep-architectures":["D04"],
 "coding-conversion":["D02"],"efficiency-hardware":["D09","D10"],"event-vision":["D06"],
 "robotics-embodied":["D08"],"sequence-language":["D05","D07"],"neuroscience-bci":["D11"],
 "benchmarks-tools":["D13"],"theory-robustness":["D12"]};
const ids=["group","technique","model","task","modality","year","venue","source","code","sort"];
const idToEl=Object.fromEntries(ids.map(k=>[k,"atlas-"+k]));
const min=8,step=20;
let papers=[],ontology=null,selected=new Set(),mode="any",visible=min,domainNames=new Map(),conceptNames=new Map();
const topicName=id=>domainNames.get(id)||id;
function state(){return {query:$("resource-search").value.trim(),topics:[...selected],mode,
 ...Object.fromEntries(ids.map(k=>[k,$(idToEl[k]).value]))};}
function criteria(skipTopics=false){
 const x=state();return {query:x.query,topics:skipTopics?[]:x.topics,mode:x.mode,group:x.group==="all"?"":x.group,
  technique:x.technique==="all"?"":x.technique,model:x.model==="all"?"":x.model,
  task:x.task==="all"?"":x.task,modality:x.modality==="all"?"":x.modality,
  year:x.year,venue:x.venue,source:x.source,code:x.code,sort:x.sort};
}
const matching=()=>core.filterWorks(papers,criteria(),ontology);
function atlasURL(id=null){
 const s=state(),u=new URL("./atlas/",location.href);
 if(s.query)u.searchParams.set("q",s.query);
 if(s.topics.length===1)u.searchParams.set("topic",s.topics[0]);
 else if(s.topics.length>1){u.searchParams.set("topics",s.topics.sort().join(","));if(mode==="all")u.searchParams.set("mode","all");}
 for(const k of ["group","technique","model","task","modality","year","venue","source","code"]){
  if(s[k]&&s[k]!=="all")u.searchParams.set(k,s[k]);
 }
 if(s.sort!=="recent")u.searchParams.set("sort",s.sort);
 if(id)u.searchParams.set("paper",id);
 u.hash="results";return u.pathname+u.search+u.hash;
}
function showPaper(w){
 const card=node("article","resource-card atlas-card");
 const head=node("div","resource-card-head");
 head.append(node("span","resource-label","RESEARCH WORK"));
 head.append(node("span","atlas-venue-label",(w.venue||"Venue pending")+" · "+(w.year||"Year pending")));
 const h=node("h3"),a=node("a","atlas-title-link",core.displayTitle(w.title));a.href=atlasURL(w.id);h.append(a);
 const summary=node("div","atlas-card-summary");
 summary.append(node("span","atlas-authors",w.authors.length===1?w.authors[0]:w.authors[0]+" et al. · "+w.authors.length+" authors"));
 if(w.doi&&/^10\./.test(w.doi)){const doi=source("https://doi.org/"+w.doi,"DOI · "+w.doi,"atlas-affiliation-hint");if(doi)summary.append(doi);}
 const context=node("p",null,domainNames.get(w.primaryDomain)||w.primaryDomain);
 const tags=node("div","atlas-card-topics");
 for(const d of w.domains.slice(0,3))tags.append(node("span","atlas-tag",d+" · "+topicName(d)));
 const detail=node("details","resource-evidence");detail.append(node("summary",null,"Method and scope"));
 const explanation=node("div","resource-evidence-body");
 if(w.techniques.length)explanation.append(node("p",null,w.techniques.map(t=>conceptNames.get(t)||t).join(" · ")));
 else explanation.append(node("p",null,"No specific atomic technique assigned from the author abstract."));
 explanation.append(node("p",null,"Classification is abstract-supported, not full-Methods verified."));
 detail.append(explanation);
 const actions=node("div","atlas-card-actions");
 const record=node("a","atlas-record-link","Research record →");record.href=atlasURL(w.id);actions.append(record);
 const p=source(w.paperUrl,"Publication ↗","resource-main-link");if(p)actions.append(p);
 const c=source(w.codeUrl,w.resourceType==="repository"?"Source repository ↗":w.resourceType==="supplementary"?"Supplement ↗":"Project / resource ↗","resource-main-link");if(c)actions.append(c);
 card.append(head,h,summary,context,tags,detail,actions);return card;
}
function topics(){
 const counts=core.topicCounts(papers,criteria(true),ontology).counts;
 const total=core.filterWorks(papers,criteria(true),ontology).length;
 const f=document.createDocumentFragment();
 const data=[["all","All research",total],...ontology.domains.map(d=>[d.id,d.en,counts.get(d.id)||0])];
 for(const [id,name,count] of data){
  const active=id==="all"?!selected.size:selected.has(id);
  const b=node("button","atlas-topic"+(active?" is-selected":""),name);b.type="button";
  b.dataset.topic=id;b.setAttribute("aria-pressed",String(active));
  b.setAttribute("aria-label",name+" · "+count+" papers in this research category");
  b.append(node("span","atlas-topic-count",count));
  b.addEventListener("click",()=>{
   if(id==="all")selected.clear();else if(selected.has(id))selected.delete(id);else selected.add(id);
   visible=min;render();updateURL("push");
  });f.append(b);
 }
 $("atlas-topics").replaceChildren(f);
}
function chips(){
 const wrap=$("atlas-active-filters"),f=document.createDocumentFragment();
 const add=(value,remove)=>{const b=node("button","atlas-active-chip",value+" ×");b.type="button";
  b.addEventListener("click",()=>{remove();visible=min;render();updateURL("push");});f.append(b);};
 for(const id of selected)add(topicName(id),()=>selected.delete(id));
 const q=$("resource-search").value.trim();if(q)add("Search: "+q,()=>$("resource-search").value="");
 if(mode==="all"&&selected.size)add("Require all",()=>{mode="any";$("atlas-topic-mode").value="any";});
 for(const k of ids.filter(x=>x!=="sort")){
  const el=$(idToEl[k]);if(el.value!=="all")add(el.selectedOptions[0]?.textContent||el.value,()=>el.value="all");
 }
 if(!f.childNodes.length)f.append(node("span","atlas-active-idle","Exploring 395 unique research works."));
 wrap.replaceChildren(f);
}
function render(){
 for(const a of document.querySelectorAll("[data-full-atlas-link]"))a.href=atlasURL();
 const matches=matching();topics();chips();
 const codeOnly=$("atlas-code").value==="yes",button=$("atlas-code-quick");
 button.setAttribute("aria-pressed",String(codeOnly));
 button.textContent=codeOnly?"Show all research ↗":"Show works with linked resources ↗";
 $("resource-grid").replaceChildren(...matches.slice(0,visible).map(showPaper));
 $("resource-count").textContent="Showing "+Math.min(visible,matches.length)+" of "+matches.length+" papers";
 $("resource-empty").hidden=matches.length>0;
 const more=$("resource-more");more.hidden=matches.length<=min;
 more.setAttribute("aria-expanded",String(visible>=matches.length));
 more.textContent=visible>=matches.length?"Show fewer results ↑":"Load "+Math.min(step,matches.length-visible)+" more works ↓";
}
function buildURL(cleanURL=false){
 const u=cleanURL?new URL(location.pathname,location.origin):new URL(location.href);
 if(cleanURL)u.hash="#library";
 for(const [key] of [...u.searchParams])if(key.startsWith("atlas."))u.searchParams.delete(key);
 const s=state();
 if(s.query)u.searchParams.set("atlas.query",s.query);
 if(s.topics.length)u.searchParams.set("atlas.topic",s.topics.sort().join(","));
 if(s.topics.length&&s.mode==="all")u.searchParams.set("atlas.mode","all");
 for(const k of ids)if(s[k]!=="all"&&s[k]!=="recent")u.searchParams.set("atlas."+k,s[k]);
 return u;
}
function updateURL(method){
 const url=buildURL();if(url.href!==location.href)history[method==="replace"?"replaceState":"pushState"](null,"",url);
}
function fill(id,values){const el=$(idToEl[id]);for(const value of values)el.add(new Option(String(value),String(value)));}
function restore(){
 const q=new URLSearchParams(location.search);
 if(q.get("atlas.format")==="resource"){location.replace("./ecosystem/");return;}
 const values=(q.get("atlas.topic")||"").split(",").flatMap(s=>legacy[s]||[s]).filter(s=>domainNames.has(s));
 selected=new Set(values);mode=q.get("atlas.mode")==="all"?"all":"any";$("atlas-topic-mode").value=mode;
 $("resource-search").value=q.get("atlas.query")||"";
 for(const k of ids){
  const el=$(idToEl[k]),v=q.get("atlas."+k)||(k==="sort"?"recent":"all");
  el.value=[...el.options].some(o=>o.value===v)?v:k==="sort"?"recent":"all";
 }
 visible=min;render();
}
async function boot(){
 const [records,tax]=await Promise.all([fetch("./atlas/works.json"),fetch("./atlas/ontology.json")]);
 if(!records.ok||!tax.ok)throw Error("Public bibliography unavailable");
 ontology=await tax.json();papers=core.validate(await records.json(),ontology).items;
 domainNames=new Map(ontology.domains.map(d=>[d.id,d.en]));
 conceptNames=new Map(ontology.techniques.map(t=>[t.id,t.label]));
 $("coverage-total").textContent=String(papers.length);
 $("coverage-code").textContent=String(papers.filter(p=>p.codeUrl).length);
 $("coverage-doi").textContent=String(papers.filter(p=>p.doi).length);
 fill("group",ontology.groups.map(g=>g.id)); // add descriptive labels below
 for(const opt of [...$("atlas-group").options].slice(1)){opt.textContent=ontology.groups.find(g=>g.id===opt.value).en;}
 fill("technique",ontology.techniques.map(t=>t.id));
 for(const opt of [...$("atlas-technique").options].slice(1)){opt.textContent=ontology.techniques.find(t=>t.id===opt.value).label;}
 for(const [key,values] of [["model",ontology.facets.model_families],["task",ontology.facets.tasks],
   ["modality",ontology.facets.modalities]])fill(key,values);
 fill("year",[...new Set(papers.map(p=>p.year).filter(Boolean))].sort((a,b)=>b-a));
 fill("venue",[...new Set(papers.map(p=>p.venue).filter(Boolean))].sort((a,b)=>a.localeCompare(b)));
 $("atlas-code-quick").addEventListener("click",()=>{
  const el=$("atlas-code");el.value=el.value==="yes"?"all":"yes";visible=min;render();updateURL("push");
 });
 for(const k of ids)$(idToEl[k]).addEventListener("change",()=>{visible=min;render();updateURL("push");});
 $("atlas-topic-mode").addEventListener("change",v=>{mode=v.target.value;visible=min;render();updateURL("push");});
 $("resource-search").addEventListener("input",()=>{visible=min;render();updateURL("replace");});
 $("atlas-reset").addEventListener("click",()=>{
  selected.clear();mode="any";$("atlas-topic-mode").value="any";$("resource-search").value="";
  for(const k of ids)$(idToEl[k]).value=k==="sort"?"recent":"all";
  visible=min;render();updateURL("push");$("resource-search").focus();
 });
 $("resource-more").addEventListener("click",()=>{
  const n=matching().length;visible=visible>=n?min:Math.min(visible+step,n);render();
 });
 $("atlas-copy").addEventListener("click",async()=>{
  const url=buildURL(true).href;
  try{await navigator.clipboard.writeText(url);$("atlas-copy-fallback").hidden=true;$("atlas-copy-status").textContent="Research link copied.";}
  catch{$("atlas-copy-input").value=url;$("atlas-copy-fallback").hidden=false;$("atlas-copy-input").select();$("atlas-copy-status").textContent="Copy the selected research URL.";}
 });
 window.addEventListener("popstate",restore);
 if(window.matchMedia("(max-width:680px)").matches)$("atlas-advanced").open=false;
 restore();
}
boot().catch(err=>{console.error("Home research:",err);$("resource-count").textContent="Bibliography unavailable";$("resource-fallback").hidden=false;});
})();