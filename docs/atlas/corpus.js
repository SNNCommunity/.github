/* SNNCommunity Research Atlas: 395 works, 6 groups, 13 domains, 69 atomic concepts. */
const $=id=>document.getElementById(id);
const research=window.SNNResearch;
if(!research)throw Error("Shared research core unavailable");
const clean=research.normalize;
const LIMIT=24;
const FIELDS=["q","group","topic","technique","model","method","task","modality","platform","snn","genre","year","venue","source","code","sort"];
const facetLookup={model:"model_families",method:"learning_methods",task:"tasks",modality:"modalities",platform:"platforms"};
const legacyTopics={"neuron-dynamics":["D01"],"learning-plasticity":["D03"],"deep-architectures":["D04"],
 "coding-conversion":["D02"],"efficiency-hardware":["D09","D10"],"event-vision":["D06"],
 "robotics-embodied":["D08"],"sequence-language":["D05","D07"],"neuroscience-bci":["D11"],
 "benchmarks-tools":["D13"],"theory-robustness":["D12"]};
const scopeLabels={snn_method_described_in_abstract:"Core SNN method (abstract-supported)",
 hybrid_snn_described_in_abstract:"Hybrid ANN–SNN method",
 sensor_adjacent_snn_unconfirmed:"Neuromorphic sensor; SNN method unconfirmed",
 snn_involvement_unconfirmed_from_abstract:"SNN involvement unresolved",
 snn_evaluation_only:"Evaluated on SNN, not an SNN-specific method",
 physical_spiking_neuron_device:"Physical spiking neuron device",
 physical_neuromorphic_synaptic_device:"Physical synaptic device",
 snn_software_infrastructure:"SNN software / runtime",
 biological_spike_data_no_snn_established:"Biological spike-data modeling",
 neuromorphic_non_snn_method:"Neuromorphic-adjacent non-SNN method",
 non_snn_binary_network_inspired_by_snn:"Non-spiking binary neural architecture"};
const genreLabels={research_article:"Research article",survey_review:"Survey / review",
 dataset_benchmark:"Dataset / benchmark",framework_software:"Software / framework",
 theoretical_study:"Theoretical study",perspective_analysis:"Perspective / analysis"};
let works=[],ontology=null,visible=LIMIT,activeDialogId=null,focusReturn=null,selectedDomains=[],matchMode="any";
let domains=new Map(),techniques=new Map(),groups=new Map();
const element=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined&&text!==null)x.textContent=String(text);if(cls)x.className=cls;return x;};
const link=(url,text,cls)=>{if(typeof url!=="string"||!/^https:\/\//.test(url))return null;
 const a=element("a",text,cls);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const state=()=>Object.fromEntries(FIELDS.map(k=>[k,$(k).value]));
const normalDomain=s=>/^D(?:0[1-9]|1[0-3])$/.test(s||"")?s:null;
const selected=()=>selectedDomains.length?selectedDomains:($( "topic").value?[$("topic").value]:[]);
function criteria(){
 const s=state();return {query:s.q,group:s.group,topics:selected(),mode:matchMode,technique:s.technique,
  model:s.model,method:s.method,task:s.task,modality:s.modality,platform:s.platform,
  snn:s.snn,genre:s.genre,year:s.year,venue:s.venue,source:s.source,code:s.code,sort:s.sort};
}
function resultURL(paper=activeDialogId,cleanUrl=false,hash=false){
 const u=cleanUrl?new URL(location.pathname,location.origin):new URL(location.href);
 for(const k of [...FIELDS,"paper","topics","mode","record"])u.searchParams.delete(k);
 const s=state();
 for(const [k,v] of Object.entries(s))if(v&&!(k==="sort"&&v==="recent"))u.searchParams.set(k,v);
 if(selectedDomains.length){u.searchParams.delete("topic");u.searchParams.set("topics",[...selectedDomains].sort().join(","));
  if(matchMode==="all")u.searchParams.set("mode","all");}
 if(paper)u.searchParams.set("paper",paper);
 if(hash)u.hash="results";
 return u;
}
function syncURL(method="push",paper=activeDialogId){
 const url=resultURL(paper);const next=url.pathname+url.search+url.hash;
 if(next!==location.pathname+location.search+location.hash)
  history[method==="replace"?"replaceState":"pushState"](null,"",next);
}
function labelDomain(id){const d=domains.get(id);return d?d.en:id;}
function addOption(id,name,values){const target=$(id);for(const [value,text] of values)target.add(new Option(text,value));}
function fillOptions(){
 addOption("group","groups",ontology.groups.map(x=>[x.id,x.en]));
 addOption("topic","domains",ontology.domains.map(x=>[x.id,x.id+" · "+x.en]));
 addOption("technique","techniques",ontology.techniques.map(x=>[x.id,x.id+" · "+x.label]));
 for(const [field,key] of Object.entries(facetLookup))addOption(field,key,ontology.facets[key].map(x=>[x,x]));
 addOption("snn","involvement",ontology.involvement.map(x=>[x,scopeLabels[x]||x]));
 addOption("genre","genre",ontology.genres.map(x=>[x,genreLabels[x]||x]));
 addOption("year","years",[...new Set(works.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a).map(y=>[String(y),String(y)]));
 addOption("venue","venues",[...new Set(works.map(x=>x.venue).filter(Boolean))].sort((a,b)=>a.localeCompare(b)).map(v=>[v,v]));
}
function convertOldLinks(){
 const u=new URL(location.href),q=u.searchParams;let changed=false;
 if(q.has("record")){
  const raw=q.get("record"),n=Number(raw);q.delete("record");changed=true;
  if(/^\d+$/.test(raw)&&n>=0&&n<396){
   const pos=n===360?75:n>360?n-1:n;
   if(works[pos])q.set("paper",works[pos].id);
  }
 }
 const existing=q.get("paper");
 if(existing){
  const target=works.find(w=>w.legacyId===existing);
  if(target&&target.id!==existing){q.set("paper",target.id);changed=true;}
 }
 const legacy=(s)=>legacyTopics[s]||[normalDomain(s)].filter(Boolean);
 const t=q.get("topic");
 if(t&&!normalDomain(t)&&legacyTopics[t]){
  const values=legacy(t);q.delete("topic");changed=true;
  if(values.length===1)q.set("topic",values[0]);else q.set("topics",values.join(","));
 }
 if(q.has("topics")){
  const v=q.get("topics").split(",").flatMap(legacy);
  const canonical=[...new Set(v.filter(Boolean))];
  if(canonical.join(",")!==q.get("topics")){q.set("topics",canonical.join(","));changed=true;}
 }
 if(changed)history.replaceState(null,"",u);
}
function restore(){
 convertOldLinks();const q=new URLSearchParams(location.search);
 for(const k of FIELDS){
  const el=$(k),value=q.get(k)||"";
  el.value=k==="q"?value:([ ...el.options ].some(v=>v.value===value)?value:(k==="sort"?"recent":""));
 }
 const batch=(q.get("topics")||"").split(",").map(normalDomain).filter(Boolean);
 selectedDomains=[...new Set(batch)];matchMode=q.get("mode")==="all"?"all":"any";
 if(selectedDomains.length)$("topic").value="";
 visible=LIMIT;
}
function activateDomain(id){
 const parent=domains.get(id);
 $("group").value=parent?.group||"";
 $("topic").value=id;
 selectedDomains=[];matchMode="any";visible=LIMIT;render();syncURL();
}
function resetAll(){
 for(const k of FIELDS)$(k).value=k==="sort"?"recent":"";
 selectedDomains=[];matchMode="any";visible=LIMIT;render();syncURL();$("q").focus();
}
function badges(w){
 const wrap=element("div",null,"tags");
 for(const id of w.domains.slice(0,3)){
  const button=element("button",labelDomain(id),"topic-button");button.type="button";
  button.addEventListener("click",()=>activateDomain(id));wrap.append(button);
 }
 return wrap;
}
function card(w){
 const art=element("article",null,"item");
 const body=element("div",null,"item-main"),actions=element("div",null,"actions");
 body.append(element("small",[w.venue,w.year||"Year pending"].filter(Boolean).join(" · ")));
 const title=element("h3"),button=element("button",research.displayTitle(w.title),"title-button");
 button.type="button";button.addEventListener("click",()=>openPaper(w.id));title.append(button);body.append(title);
 body.append(element("p",w.authors.length===1?w.authors[0]:w.authors[0]+" et al. · "+w.authors.length+" authors","paper-authors"));
 body.append(badges(w));
 if(w.techniques.length){const p=element("div",null,"atomic-preview");
   p.append(element("span","METHOD","atomic-caption"));
   for(const id of w.techniques.slice(0,3))p.append(element("span",techniques.get(id)?.label||id,"atomic-pill"));
   body.append(p);
 }
 const note=element("p",(scopeLabels[w.snnInvolvement]||"Abstract-classified research")+
  (w.codeUrl?" · Indexed software / resource":"") ,"fine");body.append(note);
 const detail=element("button","Research record →");detail.type="button";detail.addEventListener("click",()=>openPaper(w.id));actions.append(detail);
 const source=link(w.paperUrl,"Publication / indexed source ↗");if(source)actions.append(source);
 const code=link(w.codeUrl,"Linked implementation / resource ↗","action-code");if(code)actions.append(code);
 art.append(body,actions);return art;
}
function shortcuts(){
 const s=state(),opts=criteria();const groupHost=$("group-shortcuts"),topicHost=$("topic-shortcuts");
 const gc=document.createDocumentFragment();
 for(const g of ontology.groups){
  const n=research.filterWorks(works,{...opts,group:g.id,topics:[],sort:"recent"},ontology).length;
  const b=element("button",g.en+" · "+n,"group-shortcut");b.type="button";
  b.setAttribute("aria-pressed",String(s.group===g.id));
  b.addEventListener("click",()=>{$("group").value=s.group===g.id?"":g.id;$("topic").value="";
   selectedDomains=[];visible=LIMIT;render();syncURL();});
  gc.append(b);
 }
 groupHost.replaceChildren(gc);
 const optsNoDomain={...opts,topics:[],group:""};const counts=research.topicCounts(works,optsNoDomain,ontology).counts;
 const tc=document.createDocumentFragment();
 for(const d of ontology.domains){
  const b=element("button",d.id+" · "+d.en+" "+(counts.get(d.id)||0),"topic-shortcut");
  b.type="button";b.setAttribute("aria-pressed",String(selected().includes(d.id)));
  b.addEventListener("click",()=>activateDomain(d.id));tc.append(b);
 }
 topicHost.replaceChildren(tc);
}
function activeChips(){
 const s=state(),fragment=document.createDocumentFragment();
 const add=(title,reset)=>{
  const b=element("button",title+" ×");b.type="button";b.setAttribute("aria-label","Remove "+title+" filter");
  b.addEventListener("click",()=>{reset();visible=LIMIT;render();syncURL();});fragment.append(b);
 };
 for(const k of FIELDS.filter(k=>k!=="sort"&&k!=="topic")){
  if(!s[k])continue;
  let name=k==="group"?groups.get(s[k])?.en:k==="technique"?techniques.get(s[k])?.label:
    k==="snn"?scopeLabels[s[k]]:k==="genre"?genreLabels[s[k]]:
    k==="code"?(s[k]==="yes"?"Linked resources":"Unlinked papers"):s[k];
  add(name||s[k],()=>{$(k).value="";});
 }
 if(s.topic)add(labelDomain(s.topic),()=>{$("topic").value="";});
 for(const t of selectedDomains)add(labelDomain(t),()=>{selectedDomains=selectedDomains.filter(x=>x!==t);});
 if(!fragment.childNodes.length)fragment.append(element("span","Independent technique, task and model facets · 395 canonical works","idle-chip"));
 $("chips").replaceChildren(fragment);
}
function render(){
 const s=state(),opts=criteria(),matches=research.filterWorks(works,opts,ontology);
 const note=$("multi-topic-note");
 note.hidden=!selectedDomains.length;
 note.textContent=selectedDomains.length?"Imported multi-domain filter: "+selectedDomains.map(labelDomain).join(" / ")+
  (matchMode==="all"?" · match all":" · match any"):"";
 shortcuts();activeChips();
 $("count").textContent=matches.length+" papers";
 $("scope-label").textContent="Showing "+Math.min(matches.length,visible)+" of "+matches.length+
  " · 395 works · "+(matches.filter(w=>w.techniques.length).length)+" with abstract-supported technique tags";
 const fragment=document.createDocumentFragment();
 for(const w of matches.slice(0,visible))fragment.append(card(w));
 $("papers").replaceChildren(fragment);
 $("none").hidden=matches.length!==0;
 const more=$("more");more.hidden=visible>=matches.length;
 more.textContent="Load "+Math.min(LIMIT,matches.length-visible)+" more works ↓";
}
const appendLink=(wrap,url,text)=>{const a=link(url,text);if(a)wrap.append(a);};
function detailFacet(root,name,values){
 if(!values?.length)return;
 const section=element("section",null,"record-facet");
 section.append(element("h3",name));
 const wrap=element("div",null,"tags");for(const x of values)wrap.append(element("span",x));
 section.append(wrap);root.append(section);
}
function openPaper(id,fromHistory=false){
 const w=works.find(x=>x.id===id);if(!w)return;
 focusReturn=document.activeElement;
 const wrap=$("detail-body");wrap.replaceChildren();
 const body=element("section",null,"detail-content");
 body.append(element("p",[w.venue,w.year].filter(Boolean).join(" · "),"record-top"));
 const h=element("h2",research.displayTitle(w.title));h.id="detail-title";body.append(h);
 body.append(element("p",w.authors.join(", "),"detail-authors"));
 const one=domains.get(w.primaryDomain);
 body.append(element("p","Primary research domain · "+w.primaryDomain+" "+(one?.en||""),"detail-primary"));
 const table=element("div",null,"factgrid");
 for(const [key,value] of [["Year / venue",(w.year||"Pending")+" · "+(w.venue||"Unverified")],
  ["DOI",w.doi||"Not indexed"],["Bibliographic link",research.sourceLabel(w.sourceStatus)],
  ["Research scope",scopeLabels[w.snnInvolvement]||w.snnInvolvement],
  ["Publication type",genreLabels[w.publicationGenre]||w.publicationGenre],
  ["Technical evidence",w.techniques.length?w.techniques.length+" abstract-supported concept(s)":"No concept assigned from abstract"]]){
  const cell=element("div");cell.append(element("span",key),element("strong",value));table.append(cell);
 }
 body.append(table);
 detailFacet(body,"Research domains",w.domains.map(labelDomain));
 if(w.techniques.length){
  const section=element("section",null,"record-facet technique-explanations");
  section.append(element("h3","Atomic technical mechanisms"));
  for(const id of w.techniques){
    const tech=techniques.get(id);if(!tech)continue;
    const entry=element("div",null,"technique-explanation");
    entry.append(element("strong",id+" · "+tech.label));
    entry.append(element("p",tech.definition,"mechanism-definition"));
    entry.append(element("p","Not included: "+tech.exclude,"mechanism-exclusion"));
    section.append(entry);
  }
  body.append(section);
 }
 for(const [facet,heading] of [["model_families","Model families"],["learning_methods","Learning methods"],["tasks","Research tasks"],
   ["modalities","Input modalities"],["platforms","Execution platforms"],["contributions","Contribution types"]])
   detailFacet(body,heading,w.facets[facet]);
 const refs=element("div",null,"detail-links");
 appendLink(refs,w.paperUrl,"Publication / indexed source ↗");
 appendLink(refs,w.codeUrl,w.resourceType==="repository"?"Source repository ↗":
   w.resourceType==="supplementary"?"Supplementary material ↗":
   w.resourceType==="reproducibility capsule"?"Reproducibility capsule ↗":"Project website ↗");
 if(w.indexedSourceUrl&&w.indexedSourceUrl!==w.paperUrl)
  appendLink(refs,w.indexedSourceUrl,"Other indexed source ↗");
 if(w.doi&&/^10\./.test(w.doi))appendLink(refs,"https://doi.org/"+w.doi,"DOI ↗");
 body.append(refs);
 if(w.sourceWarnings)body.append(element("p","Source identity or publication metadata requires checking before citation.","warning"));
 body.append(element("p","Research-domain and technical labels are based on the supplied abstract-reviewed catalogue. Full-text Methods, code equivalence and reproduction have not been independently verified. No abstract text is published here.","fine"));
 wrap.append(body);if(!$("detail").open)$("detail").showModal();
 activeDialogId=w.id;
 if(!fromHistory)syncURL("push",w.id);
}
function closePaper(update=true){
 if($("detail").open)$("detail").close();activeDialogId=null;
 if(update)syncURL("replace",null);
 if(focusReturn?.isConnected)focusReturn.focus({preventScroll:true});
}
function applyHistory(){
 restore();render();
 const id=new URLSearchParams(location.search).get("paper");
 if(id&&works.some(w=>w.id===id))openPaper(id,true);
 else if($("detail").open)closePaper(false);
}
function connect(){
 for(const k of FIELDS)$(k).addEventListener(k==="q"?"input":"change",()=>{
  if(k==="topic"){
   selectedDomains=[];matchMode="any";
   const d=domains.get($("topic").value);
   $("group").value=d?.group||"";
  }
  if(k==="group"){$("topic").value="";selectedDomains=[];}
  if(k==="technique"&&$("technique").value){
   const tech=techniques.get($("technique").value);
   const parent=domains.get(tech?.domain);
   if(parent){$("group").value=parent.group;$("topic").value=parent.id;selectedDomains=[];matchMode="any";}
  }
  visible=LIMIT;render();syncURL(k==="q"?"replace":"push");
 });
 $("reset").addEventListener("click",resetAll);
 $("more").addEventListener("click",()=>{visible+=LIMIT;render();});
 $("share").addEventListener("click",async()=>{
  const url=resultURL(null,true,true).href;
  try{await navigator.clipboard.writeText(url);$("announce").textContent="Research search link copied.";}
  catch{$("share-fallback").hidden=false;$("share-input").value=url;$("share-input").focus();$("share-input").select();}
 });
 $("close").addEventListener("click",()=>closePaper());
 $("detail").addEventListener("close",()=>{if(activeDialogId)closePaper();});
 window.addEventListener("popstate",applyHistory);
 if(window.matchMedia("(max-width:680px)").matches)$("facet-details").open=false;
}
async function boot(){
 const [r,o]=await Promise.all([fetch("./works.json"),fetch("./ontology.json")]);
 if(!r.ok||!o.ok)throw Error("Research index or ontology missing");
 ontology=await o.json();const data=research.validate(await r.json(),ontology);
 works=data.items;
 domains=new Map(ontology.domains.map(x=>[x.id,x]));
 techniques=new Map(ontology.techniques.map(x=>[x.id,x]));
 groups=new Map(ontology.groups.map(x=>[x.id,x]));
 fillOptions();connect();applyHistory();
}
boot().catch(err=>{console.error("Research Atlas:",err);$("count").textContent="Catalog unavailable";$("error").hidden=false;});
