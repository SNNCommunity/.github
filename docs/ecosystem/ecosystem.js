/* SNNCommunity ecosystem directory — source-driven, de-duplicated project view. */
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const definitions=[
  {id:"spikingjelly",label:"SpikingJelly",kind:"framework",sources:["spikingjelly"]},
  {id:"snntorch",label:"snnTorch",kind:"framework",sources:["snntorch-tutorials","snntorch-code"]},
  {id:"norse",label:"Norse",kind:"framework",sources:["norse"]},
  {id:"tonic",label:"Tonic",kind:"data",sources:["tonic"]},
  {id:"neurobench",label:"NeuroBench",kind:"evaluation",sources:["neurobench","neurobench-docs"]},
  {id:"nir",label:"Neuromorphic Intermediate Representation",kind:"interoperability",sources:["nir"]},
  {id:"open-neuromorphic",label:"Open Neuromorphic",kind:"community",sources:["open-neuromorphic"]}
 ];
 const label={framework:"Framework",data:"Event data",evaluation:"Evaluation",interoperability:"Interoperability",community:"Community"};
 const el=(tag,text,cls)=>{
  const n=document.createElement(tag);
  if(text!==undefined&&text!==null)n.textContent=text;
  if(cls)n.className=cls;
  return n;
 };
 let projects=[],selected="all";
 function render(){
  const query=$("ecosystem-search").value.trim().toLocaleLowerCase();
  const visible=projects.filter(p=>(selected==="all"||p.kind===selected)&&
   [p.label,...p.links.map(x=>x.title+" "+x.description),label[p.kind]].join(" ").toLocaleLowerCase().includes(query));
  const frag=document.createDocumentFragment();
  for(const p of visible){
   const card=el("article",null,"portal-card");
   card.append(el("span",label[p.kind].toUpperCase(),"portal-card-meta"));
   card.append(el("h3",p.label));
   card.append(el("p",p.links[0].description));
   const row=el("div",null,"portal-link-row");
   for(const source of p.links){
    if(!/^https:\/\//.test(source.url))continue;
    const a=el("a",source.id.endsWith("-docs")||source.id==="spikingjelly"||source.id==="snntorch-tutorials"?"Documentation ↗":source.id==="open-neuromorphic"?"Community website ↗":"Source ↗");
    a.href=source.url;a.target="_blank";a.rel="noopener noreferrer";row.append(a);
   }
   card.append(row);frag.append(card);
  }
  $("ecosystem-grid").replaceChildren(frag);
  $("ecosystem-empty").hidden=visible.length!==0;
  $("ecosystem-count").textContent=visible.length+" of "+projects.length+" projects";
  for(const b of document.querySelectorAll("[data-kind]"))b.setAttribute("aria-pressed",String(b.dataset.kind===selected));
 }
 for(const b of document.querySelectorAll("[data-kind]"))b.addEventListener("click",()=>{selected=b.dataset.kind;render();});
 $("ecosystem-search").addEventListener("input",render);
 fetch("../resources.json").then(r=>{if(!r.ok)throw Error("Catalog request failed");return r.json();}).then(data=>{
  const records=new Map(data.items.filter(x=>x.type!=="paper").map(x=>[x.id,x]));
  projects=definitions.map(d=>({...d,links:d.sources.map(id=>records.get(id)).filter(Boolean)})).filter(d=>d.links.length);
  $("project-count").textContent=String(projects.length);
  $("resource-count").textContent=String([...records.values()].length);
  render();
 }).catch(()=>{$("ecosystem-count").textContent="Catalog unavailable";$("ecosystem-error").hidden=false;});
})();
