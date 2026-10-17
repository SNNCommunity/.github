/* Canonical research search for 395 abstract-free papers and an orthogonal atomic ontology. */
(function(root){"use strict";
const normalize=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("en")
 .replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
const displayTitle=v=>String(v??"").replace(/\$\\mathcal\{O\}\(([^$]+)\)\$/g,"O($1)")
 .replace(/\$O\(([^$]+)\)\$/g,"O($1)")
 .replace(/\$\^([0-9])\$/g,(_,n)=>["⁰","¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹"][Number(n)])
 .replace(/\$([^$]+)\$/g,"$1");
const statusText={publisher_specific_page_not_independently_rechecked:"Publisher-specific source (indexed)",
 conference_index_or_aggregate_not_paper_specific:"Venue index / aggregate",
 not_identified:"Paper-specific publication link unresolved"};
const sourceLabel=v=>statusText[v]||"Source status unavailable";
const keys=new Set(["id","title","year","venue","authors","authorCount","doi","paperUrl","codeUrl","sourceStatus","sourceWarnings",
 "primaryDomain","domains","techniques","facets","snnInvolvement","publicationGenre",
 "legacyId","publisherUrl","indexedSourceUrl","resourceType"]);
const facetKeys=["model_families","learning_methods","tasks","modalities","platforms","contributions"];
function validate(data,ontology){
 if(data?.schemaVersion!=="atomic-public-395-v1"||data.count!==395||data.items?.length!==395)
  throw Error("Expected 395 unique canonical research works");
 const ids=new Set(),aliases=new Set(),titles=new Set();let technical=0;const used=new Set();
 const dset=new Set((ontology?.domains||[]).map(x=>x.id));
 const parent=new Map((ontology?.techniques||[]).map(t=>[t.id,t.domain]));
 if(ontology){
  const groupDomains=new Set((ontology.groups||[]).flatMap(g=>g.domains));
  if(ontology.domains.some(d=>!groupDomains.has(d.id)))throw Error("Domain missing from scientific group");
  if(ontology.techniques.some(t=>t.id.split(".")[0]!==t.domain||!dset.has(t.domain)||!t.definition||!t.exclude))
   throw Error("Invalid technical concept parent domain or missing definition/exclusion");
 }
 const tset=new Set((ontology?.techniques||[]).map(x=>x.id));
 for(const w of data.items){
  if(Object.keys(w).some(k=>!keys.has(k)))throw Error("Unexpected or private research field in "+w.id);
  const title=normalize(w.title);
  if(!w.id||ids.has(w.id)||!title||titles.has(title)||!Array.isArray(w.authors)||!w.authors.length||
   !Array.isArray(w.domains)||!w.domains.includes(w.primaryDomain)||!Array.isArray(w.techniques)||!w.facets||
   !/^https:\/\//.test(w.paperUrl||"")||!("sourceStatus" in w)||
   w.authorCount!==w.authors.length||!w.authors.every(n=>typeof n==="string"&&n.trim())||
   !/^work-/.test(w.id)||(w.legacyId&&aliases.has(w.legacyId))||
   (w.doi&&(!/^10\.[0-9]{4,9}\/.+/.test(w.doi)||/\/full$/.test(w.doi))))
   throw Error("Invalid or duplicate public work "+w.id);
  for(const t of w.techniques){
   if(ontology&&!tset.has(t))throw Error("Unknown concept "+t);
   if(ontology&&!w.domains.includes(parent.get(t)))throw Error("Technical concept domain mismatch "+w.id+" "+t);
   used.add(t);
  }
  if(ontology&&w.domains.some(d=>!dset.has(d)))throw Error("Unknown domain "+w.id);
  for(const k of facetKeys)if(!Array.isArray(w.facets[k]))throw Error("Invalid facet "+k);
  ids.add(w.id);if(w.legacyId)aliases.add(w.legacyId);titles.add(title);technical+=w.techniques.length;
 }
 if(ontology&&(ontology.domains.length!==13||ontology.groups.length!==6||ontology.techniques.length!==69||
    used.size!==69||technical!==280))throw Error("Ontology coverage mismatch");
 if(data.items.filter(w=>w.techniques.length).length!==226)throw Error("Technical evidence count mismatch");
 if(data.items.filter(w=>w.codeUrl).length!==159)throw Error("Indexed code/resource coverage mismatch");
 if(data.items.filter(w=>w.resourceType==="repository").length!==153)throw Error("Repository link count mismatch");
 return data;
}
function domainNames(ontology){return new Map((ontology?.domains||[]).map(x=>[x.id,[x.en,x.zh].join(" ")]));}
function searchText(w,ontology){
 const d=domainNames(ontology),tech=new Map((ontology?.techniques||[]).map(x=>[x.id,x.label]));
 return normalize([w.title,...w.authors,w.doi,w.year,w.venue,w.id,w.legacyId,
  ...w.domains.flatMap(x=>[x,d.get(x)]),...w.techniques.flatMap(x=>[x,tech.get(x)]),
  ...facetKeys.flatMap(k=>w.facets[k]||[]),w.snnInvolvement,w.publicationGenre].filter(x=>x!=null).join(" "));
}
function filterWorks(items,opts={},ontology){
 const s={query:"",topics:[],mode:"any",domain:"",group:"",technique:"",model:"",method:"",task:"",modality:"",
  platform:"",snn:"",genre:"",year:"",venue:"",source:"",code:"",sort:"recent",...opts};
 const terms=normalize(s.query).split(" ").filter(Boolean);
 const allowedGroup=new Set((ontology?.groups||[]).find(g=>g.id===s.group)?.domains||[]);
 const domains=s.topics.length?s.topics:(s.domain?[s.domain]:[]);
 const facetFilters={model:"model_families",method:"learning_methods",task:"tasks",modality:"modalities",platform:"platforms"};
 return items.filter(w=>{
  if(s.group&&(!allowedGroup.size||!w.domains.some(d=>allowedGroup.has(d))))return false;
  if(domains.length&&(s.mode==="all"?!domains.every(d=>w.domains.includes(d)):!domains.some(d=>w.domains.includes(d))))return false;
  if(s.technique&&!w.techniques.includes(s.technique))return false;
  for(const [opt,key] of Object.entries(facetFilters))if(s[opt]&&!w.facets[key].includes(s[opt]))return false;
  if(s.snn&&w.snnInvolvement!==s.snn)return false;
  if(s.genre&&w.publicationGenre!==s.genre)return false;
  if(s.year&&s.year!=="all"&&String(w.year)!==String(s.year))return false;
  if(s.venue&&s.venue!=="all"&&w.venue!==s.venue)return false;
  if(s.source&&s.source!=="all"&&w.sourceStatus!==s.source)return false;
  if(s.code&&s.code!=="all"&&(s.code==="yes"?!w.codeUrl:!!w.codeUrl))return false;
  const hay=searchText(w,ontology);return terms.every(t=>hay.includes(t));
 }).sort((a,b)=>s.sort==="title"?a.title.localeCompare(b.title,"en"):
  s.sort==="oldest"?(a.year||9999)-(b.year||9999)||a.title.localeCompare(b.title,"en"):
  (b.year||-1)-(a.year||-1)||a.title.localeCompare(b.title,"en"));
}
function topicCounts(items,opts,ontology){
 const base=filterWorks(items,{...opts,topics:[],domain:"",group:""},ontology),counts=new Map();
 for(const w of base)for(const d of w.domains)counts.set(d,(counts.get(d)||0)+1);
 return {total:base.length,counts};
}
const api=Object.freeze({normalize,displayTitle,validate,searchText,filterWorks,topicCounts,sourceLabel});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.SNNResearch=api;
})(typeof window!=="undefined"?window:globalThis);
