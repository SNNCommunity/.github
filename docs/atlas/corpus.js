/* Source-linked canonical research Atlas: 395 unique public works. */
const $=id=>document.getElementById(id);
const research=window.SNNResearch;
if(!research)throw Error("Shared research index is unavailable");
const TOPICS=[
 ["neuron-dynamics","Neuron dynamics"],["learning-plasticity","Learning & plasticity"],
 ["deep-architectures","Deep architectures"],["coding-conversion","Coding & conversion"],
 ["efficiency-hardware","Efficiency & hardware"],["event-vision","Event-based vision"],
 ["robotics-embodied","Robotics & embodied AI"],["sequence-language","Sequence & language"],
 ["neuroscience-bci","Neuroscience & BCI"],["benchmarks-tools","Benchmarks & tools"],
 ["theory-robustness","Theory & robustness"]];
const FIELDS=["q","topic","year","venue","source","code","sort"];
const LIMIT=24;
const TOPIC_ALIASES={
 "neuron-dynamics":["LIF","PLIF","membrane potential","神经元动力学","膜电位"],
 "learning-plasticity":["surrogate gradient","STDP","替代梯度","脉冲学习"],
 "deep-architectures":["Spikformer","SNN Transformer","residual SNN","深度架构"],
 "coding-conversion":["ANN SNN conversion","coding","脉冲编码","编码转换"],
 "efficiency-hardware":["low power","neuromorphic chip","低功耗"],
 "event-vision":["event camera","DVS","事件相机","事件视觉"],
 "robotics-embodied":["embodied AI","robot","VLA","具身智能"],
 "sequence-language":["temporal modeling","speech","language model","时序建模"],
 "neuroscience-bci":["EEG","brain computer interface","脑机接口"],
 "benchmarks-tools":["dataset","benchmark","framework","数据集"],
 "theory-robustness":["stability","adversarial","robustness","鲁棒性"]};
const names=new Map(TOPICS.map(([id,title])=>[id,[title,...(TOPIC_ALIASES[id]||[])].join(" ")]));
const normalize=research.normalize;
const labels=new Map(TOPICS);
const label=id=>labels.get(id)||id;
const validLink=v=>typeof v==="string"&&/^https:\/\//i.test(v)?v:null;
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=String(text);if(cls)e.className=cls;return e;};
let all=[],visible=LIMIT,focusedBeforeDialog=null,openId=null,extraTopics=[],topicMode="any";
const state=()=>Object.fromEntries(FIELDS.map(k=>[k,$(k).value]));
function readURL(){
 const q=new URLSearchParams(location.search);
 for(const k of FIELDS){
   const wanted=q.get(k)|| (k==="sort"?"recent":"");
   const target=$(k);
   target.value=k==="q"?wanted:([...target.options].some(o=>o.value===wanted)?wanted:k==="sort"?"recent":"");
 }
 const allowed=new Set(TOPICS.map(t=>t[0]));
 extraTopics=[...new Set((q.get("topics")||"").split(",").filter(t=>allowed.has(t)))];
 topicMode=q.get("mode")==="all"?"all":"any";
 if(extraTopics.length)$("topic").value="";
}
function makeURL(id=openId,withHash=false,clean=false){
 const u=clean?new URL(location.pathname,location.origin):new URL(location.href);
 for(const k of [...FIELDS,"paper","topics","mode"])u.searchParams.delete(k);
 const s=state();
 for(const [k,v] of Object.entries(s))if(v&&!(k==="sort"&&v==="recent"))u.searchParams.set(k,v);
 if(extraTopics.length){u.searchParams.delete("topic");u.searchParams.set("topics",[...extraTopics].sort().join(","));
   if(topicMode==="all")u.searchParams.set("mode","all");}
 if(id)u.searchParams.set("paper",id);
 if(withHash)u.hash="results";
 return u;
}
function updateURL(method="push",id=openId){
 const u=makeURL(id),next=u.pathname+u.search+u.hash;
 if(next!==location.pathname+location.search+location.hash){
   history[method==="replace"?"replaceState":"pushState"](history.state,"",next);
 }
}
function selectOptions(){
 for(const [id,name] of TOPICS)$("topic").add(new Option(name,id));
 const years=[...new Set(all.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a);
 for(const year of years)$("year").add(new Option(String(year),String(year)));
 const venues=[...new Set(all.map(x=>x.venue).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 for(const venue of venues)$("venue").add(new Option(venue,venue));
}
const sourceName=research.sourceLabel;
function candidates(){
 const s=state();
 return research.filterWorks(all,{query:s.q,topics:extraTopics.length?extraTopics:(s.topic?[s.topic]:[]),mode:topicMode,year:s.year||"all",
 venue:s.venue||"all",source:s.source||"all",code:s.code||"all",sort:s.sort},names);
}
function chips(s){
 const wrap=$("chips"),frag=document.createDocumentFragment();
 for(const k of ["q","topic","year","venue","source","code"]){
   if(!s[k])continue;
   const title=k==="topic"?label(s[k]):k==="source"?sourceName(s[k]):k==="code"?(s[k]==="yes"?"Code available":"Code not indexed"):s[k];
   const button=el("button",title+" ×");
   button.type="button";button.setAttribute("aria-label","Remove "+title+" filter");
   button.addEventListener("click",()=>{$(k).value="";visible=LIMIT;render();updateURL();$("q").focus();});
   frag.append(button);
 }
 if(extraTopics.length){
   for(const t of extraTopics){
     const b=el("button","Topic: "+label(t)+" ×");
     b.type="button";b.setAttribute("aria-label","Remove inherited "+label(t)+" topic");
     b.addEventListener("click",()=>{
       extraTopics=extraTopics.filter(x=>x!==t);
       if(extraTopics.length===1){$("topic").value=extraTopics[0];extraTopics=[];}
       visible=LIMIT;render();updateURL();
     });frag.append(b);
   }
   if(topicMode==="all"&&extraTopics.length>1){
     const b=el("button","Match all selected topics ×");b.type="button";
     b.addEventListener("click",()=>{topicMode="any";visible=LIMIT;render();updateURL();});
     frag.append(b);
   }
 }
 wrap.replaceChildren(frag);
}
function tag(id){
 const b=el("button",label(id));b.type="button";b.className="topic-button";
 b.addEventListener("click",()=>{$("topic").value=id;extraTopics=[];topicMode="any";visible=LIMIT;render();updateURL();});
 return b;
}
function anchor(url,title,cls){
 if(!validLink(url))return null;
 const a=el("a",title,cls);a.href=url;a.target="_blank";a.rel="noopener noreferrer";
 return a;
}
function card(x){
 const item=el("article",null,"item");
 const body=el("div",null,"item-main"),actions=el("div",null,"actions");
 body.append(el("small",[x.venue,x.year||"Year not listed"].filter(Boolean).join(" · ")));
 const h=el("h3"),button=el("button",research.displayTitle(x.title),"title-button");button.type="button";button.addEventListener("click",()=>openPaper(x.id));
 h.append(button);body.append(h);
 body.append(el("p",[x.authors?.[0]?(x.authors[0]+(x.authorCount>1?" et al. · "+x.authorCount+" authors":"")):"Author information pending"].join(""),"paper-authors"));
 if(x.doi&&/^10\./.test(x.doi)){const doi=anchor("https://doi.org/"+x.doi,"DOI · "+x.doi,"paper-doi");if(doi)body.append(doi);}
 const tags=el("div",null,"tags");
 for(const t of (x.topics||[]).slice(0,4))tags.append(tag(t));
 body.append(tags);
 const info=el("p",(x.versionCount>1?"Preprint + publication · ":"")+sourceName(x.sourceStatus)
   +(x.codeUrl?" · Linked code":"")+(x.editorialSourceChecked20261014?" · Source reviewed":""),
   "fine");
 body.append(info);
 const detail=el("button","Paper details →");
 detail.type="button";detail.addEventListener("click",()=>openPaper(x.id));
 actions.append(detail);
 const source=anchor(x.paperUrl,"Indexed publication / venue ↗");
 if(source)actions.append(source);
 const code=anchor(x.codeUrl,"View code ↗","action-code");if(code)actions.append(code);
 item.append(body,actions);return item;
}
function renderShortcuts(s){
 const target=$("topic-shortcuts");if(!target)return;
 const counts=research.topicCounts(all,{query:s.q,year:s.year||"all",venue:s.venue||"all",source:s.source||"all",code:s.code||"all"},names).counts;
 const chosen=extraTopics.length?extraTopics:[s.topic].filter(Boolean);
 const frag=document.createDocumentFragment();
 for(const id of ["neuron-dynamics","learning-plasticity","deep-architectures","event-vision","robotics-embodied"]){
   const b=el("button",label(id)+" · "+(counts.get(id)||0),"topic-shortcut");
   b.type="button";b.setAttribute("aria-pressed",String(chosen.includes(id)));
   b.addEventListener("click",()=>{
     $("topic").value=chosen.length===1&&chosen[0]===id?"":id;
     extraTopics=[];topicMode="any";visible=LIMIT;render();updateURL();
   });
   frag.append(b);
 }
 target.replaceChildren(frag);
}
function render(){
 const note=$("multi-topic-note");
 note.hidden=!extraTopics.length;
 note.textContent=extraTopics.length?("Inherited homepage topic filter: "+extraTopics.map(label).join(", ")+
   " · "+(topicMode==="all"?"match every topic":"match any topic")+". Remove topics using the chips below."):"";
 const matches=candidates(),s=state(),fragment=document.createDocumentFragment();
 renderShortcuts(s);
 $("count").textContent=matches.length+" papers";
 $("scope-label").textContent="Showing "+Math.min(visible,matches.length)+" of "+matches.length+" · 395 indexed papers";
 chips(s);
 for(const x of matches.slice(0,visible))fragment.append(card(x));
 $("papers").replaceChildren(fragment);
 $("none").hidden=matches.length!==0;
 $("more").hidden=visible>=matches.length;
 $("more").textContent="Load "+Math.min(LIMIT,Math.max(0,matches.length-visible))+" more papers ↓";
}
function showLink(target,url,caption){
 const a=anchor(url,caption);if(a)target.append(a);
}
function openPaper(id,fromHistory=false){
 const p=all.find(x=>x.id===id);if(!p)return;
 focusedBeforeDialog=document.activeElement;
 const dialog=$("detail"),box=$("detail-body");box.replaceChildren();
 const content=el("section",null,"detail-content");
 content.append(el("p",[p.venue,p.year].filter(Boolean).join(" · "),"record-top"));
 const h=el("h2",research.displayTitle(p.title));h.id="detail-title";content.append(h);
 content.append(el("h3","Authors"));
 content.append(el("p",(p.authors||[]).join(", ")+(p.authorCount>p.authors.length?
    " · "+p.authorCount+" authors listed (first author indexed here).":"")));
 const badges=el("div",null,"tags");for(const t of p.topics||[])badges.append(el("span",label(t)));content.append(badges);
 const facts=el("div",null,"factgrid");
 for(const [key,value] of [["Publication",p.venue+" · "+(p.year||"Year not listed")],
   ["DOI",p.doi||"Not indexed"],["Source coverage",sourceName(p.sourceStatus)],
   ["Code",p.codeUrl?"Link available":"Not listed"]]){
   const cell=el("div");cell.append(el("span",key),el("strong",value));facts.append(cell);
 }
 content.append(facts);
 const refs=el("div",null,"detail-links");
 showLink(refs,p.paperUrl,"Open indexed publication / venue ↗");
 if(p.codeUrl)showLink(refs,p.codeUrl,"View software ↗");
 if(p.doi&&/^10\./.test(p.doi))showLink(refs,"https://doi.org/"+p.doi,"Resolve DOI ↗");
 content.append(refs);
 if(p.versionCount>1){
   content.append(el("h3","Publication history"));
   
   const vl=el("ul",null,"version-list");
   for(const v of p.versions||[]){
     const li=el("li");
     li.append(el("strong",v.title+" · "+(v.year||"Year unresolved")+" "));
     showLink(li,v.paperUrl,"Version source ↗");vl.append(li);
   }
   content.append(vl);
 }
 if(p.sourceWarnings)content.append(el("p","Source or identity warning: check the linked publication before citing.","warning"));

 if(p.editorialSourceChecked20261014)content.append(el("p","Publication link reviewed for the October 2026 index.","fine"));
 box.append(content);
 if(!dialog.open)dialog.showModal();
 openId=p.id;
 if(!fromHistory)updateURL("push",p.id);
}
function closePaper(update=true){
 const dialog=$("detail");if(dialog.open)dialog.close();
 openId=null;
 if(update)updateURL("replace",null);
 if(focusedBeforeDialog?.isConnected)focusedBeforeDialog.focus({preventScroll:true});
}
function migrateLegacyRecordURL(){
 const u=new URL(location.href),raw=u.searchParams.get("record");
 if(raw===null)return;
 u.searchParams.delete("record");
 const index=Number(raw);
 if(/^\d+$/.test(raw)&&Number.isInteger(index)&&index>=0&&index<396){
   const work=all.find(x=>x.sourceIndex===index||
     x.versions?.some(v=>v.sourceIndex===index));
   if(work)u.searchParams.set("paper",work.id);
 }
 // Historic positional links resolve to the canonical 395-work record IDs.
 history.replaceState(history.state,"",u);
}
function applyHistory(){
 migrateLegacyRecordURL();
 readURL();visible=LIMIT;render();
 const id=new URLSearchParams(location.search).get("paper");
 if(id&&all.some(x=>x.id===id))openPaper(id,true);
 else if($("detail").open)closePaper(false);
}
function bind(){
 for(const k of FIELDS)$(k).addEventListener(k==="q"?"input":"change",()=>{
   if(k==="topic"){extraTopics=[];topicMode="any";}
   visible=LIMIT;render();updateURL(k==="q"?"replace":"push");
 });
 $("reset").addEventListener("click",()=>{
   for(const k of FIELDS)$(k).value=k==="sort"?"recent":"";
   extraTopics=[];topicMode="any";
   visible=LIMIT;render();updateURL("push");$("q").focus();
 });
 $("more").addEventListener("click",()=>{visible+=LIMIT;render();});
 $("share").addEventListener("click",async()=>{
   const url=makeURL(null,true,true).href;
   try{await navigator.clipboard.writeText(url);$("announce").textContent="Clean research search URL copied.";}
   catch{$("share-fallback").hidden=false;$("share-input").value=url;$("share-input").focus();$("share-input").select();}
 });
 $("close").addEventListener("click",()=>closePaper());
 $("detail").addEventListener("close",()=>{if(openId)closePaper();});
 window.addEventListener("popstate",applyHistory);
}
async function start(){
 const r=await fetch("./works.json");
 if(!r.ok)throw Error("Research works unavailable");
 const data=research.validate(await r.json());
 all=data.items;
 selectOptions();bind();applyHistory();
}
start().catch(e=>{console.error("Research Atlas:",e);$("count").textContent="Unable to load public research works";$("error").hidden=false;});
