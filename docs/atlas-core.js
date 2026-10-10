/* Research Atlas: deterministic filtering, metadata boundaries and indexed aliases. */
(function(root){
"use strict";
const normalize=v=>String(v??"").normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("en")
  .replace(/[‐‑‒–—−_]/g," ").replace(/[^\p{L}\p{N}]+/gu," ").trim()
  .replace(/\s+/g," ");
const institutionAliases={
 "Peking University":["北京大学"],
 "Peng Cheng Laboratory":["鹏城实验室"],
 "University of Oxford":["牛津大学"],
 "ETH Zurich":["苏黎世联邦理工学院"],
 "University of Zurich":["苏黎世大学"],
 "University of Pennsylvania":["宾夕法尼亚大学"],
 "University of Chinese Academy of Sciences":["中国科学院大学"],
 "Technische Universität Berlin":["柏林工业大学"],
 "Imperial College London":["帝国理工学院"]
};
function searchCorpus(item,topicDefs=[]){
 const defs=new Map(topicDefs.map(t=>[t.id,t]));
 const chunks=[item.title,item.publisher,item.description,item.doi,item.type,item.id,
   item.publication?.venue,item.publication?.year,item.researchQuestion,
   item.researchMethod,item.evaluationScope,
   ...(item.searchAliases||[]),
   ...(item.authorships||[]).map(a=>a.name),
   ...(item.topics||[]).flatMap(id=>{
     const topic=defs.get(id);
     return [id,topic?.label,...(topic?.aliases||[])];
   }),
   ...(item.affiliations||[]).flatMap(a=>[
      a.university,a.country,...(institutionAliases[a.university]||[])
   ])];
 return normalize(chunks.filter(x=>x!=null).join(" "));
}
function matches(item,options={},topicDefs=[]){
 const f={topic:"all",topics:[],topicMode:"any",format:"all",year:"all",
    venueType:"all",venue:"all",country:"all",university:"all",query:"",...options};
 const pub=item.publication,affs=item.affiliations||[];
 const chosen=Array.isArray(f.topics)&&f.topics.length?f.topics:(f.topic!=="all"?[f.topic]:[]);
 if(chosen.length && !(f.topicMode==="all"
    ?chosen.every(t=>(item.topics||[]).includes(t))
    :chosen.some(t=>(item.topics||[]).includes(t))))return false;
 if(f.format==="paper"&&item.type!=="paper")return false;
 if(f.format==="resource"&&item.type==="paper")return false;
 if(f.year!=="all"&&String(pub?.year)!==String(f.year))return false;
 if(f.venueType!=="all"&&pub?.kind!==f.venueType)return false;
 if(f.venue!=="all"&&pub?.venue!==f.venue)return false;
 if(f.country==="unknown"){
   if(item.type!=="paper"||item.affiliationCoverage!=="unverified")return false;
 }else if(f.country==="not_applicable"){
   if(item.type==="paper")return false;
 }else if(f.country!=="all"&&!affs.some(a=>a.country===f.country))return false;
 if(f.university!=="all"&&!affs.some(a=>
   a.university===f.university&&(f.country==="all"||f.country===a.country)))return false;
 const query=normalize(f.query);
 if(query){
   const text=searchCorpus(item,topicDefs);
   // Each query term may match a different supported metadata field.
   if(!query.split(" ").every(token=>text.includes(token)))return false;
 }
 return true;
}
function filter(items,options={},topicDefs=[]){
 const out=items.filter(item=>matches(item,options,topicDefs));
 const sort=options.sort||"recent";
 out.sort((a,b)=>{
   if(sort==="title")return a.title.localeCompare(b.title,"en");
   const ay=a.publication?.year??-1,by=b.publication?.year??-1;
   const aScore=ay<0?(sort==="oldest"?Infinity:-Infinity):ay;
   const bScore=by<0?(sort==="oldest"?Infinity:-Infinity):by;
   const delta=sort==="oldest"?aScore-bScore:bScore-aScore;
   return delta||a.title.localeCompare(b.title,"en");
 });
 return out;
}
function topicCounts(items,options={},topicDefs=[]){
 const base={...options,topic:"all",topics:[]};
 const counts=new Map();
 for(const item of filter(items,base,topicDefs)){
   for(const id of item.topics||[])counts.set(id,(counts.get(id)||0)+1);
 }
 return counts;
}
function facets(items){
 const pubs=items.map(x=>x.publication).filter(Boolean);
 const affs=items.flatMap(x=>x.affiliations||[]);
 return {
  years:[...new Set(pubs.map(p=>p.year))].sort((a,b)=>b-a),
  venues:[...new Set(pubs.map(p=>p.venue))].sort((a,b)=>a.localeCompare(b)),
  countries:[...new Set(affs.map(a=>a.country))].sort((a,b)=>a.localeCompare(b)),
  universities:country=>[...new Set(affs.filter(a=>country==="all"||a.country===country)
    .map(a=>a.university))].sort((a,b)=>a.localeCompare(b))
 };
}
function validate(data){
 if(data?.schemaVersion!==2||!Array.isArray(data.items)||!Array.isArray(data.topics))
   throw Error("Unsupported research catalog schema");
 const topics=new Set(data.topics.map(t=>t.id)),ids=new Set();
 if(topics.size!==data.topics.length)throw Error("Duplicate research topic");
 for(const t of data.topics){
   if(!/^[a-z0-9-]+$/.test(t.id)||!t.label||!Array.isArray(t.aliases))
     throw Error("Invalid research topic descriptor");
 }
 for(const item of data.items){
   if(!item.id||!/^[a-z0-9-]+$/.test(item.id)||ids.has(item.id))
     throw Error("Duplicate or empty atlas identifier");
   ids.add(item.id);
   if(!item.title||!/^https:\/\//.test(item.url)||item.verification!=="indexed_not_reproduced")
     throw Error("Invalid atlas entry "+item.id);
   if(!Array.isArray(item.topics)||!item.topics.length||item.topics.some(t=>!topics.has(t)))
     throw Error("Invalid research topics for "+item.id);
   if(!Array.isArray(item.searchAliases)||item.searchAliases.some(s=>typeof s!=="string"))
     throw Error("Invalid research aliases for "+item.id);
   if(!Array.isArray(item.affiliations))throw Error("Missing affiliations for "+item.id);
   if(item.type==="paper"){
     if(!item.publication||!Number.isInteger(item.publication.year)||
        !["Conference","Journal"].includes(item.publication.kind)||!item.publication.venue||
        !/^https:\/\//.test(item.bibliographySource||""))
       throw Error("Invalid bibliography for "+item.id);
     if(!["unverified","partial","complete"].includes(item.affiliationCoverage))
       throw Error("Invalid affiliation coverage for "+item.id);
     if(item.affiliationCoverage==="unverified"&&item.affiliations.length)
       throw Error("Unknown coverage cannot claim cited affiliations: "+item.id);
     if(item.affiliationCoverage==="partial"&&!item.affiliations.length)
       throw Error("Partial affiliation requires source evidence: "+item.id);
     if(!Array.isArray(item.authorships)||!["publisher_listed","unverified"].includes(item.authorshipStatus))
       throw Error("Invalid authorship status for "+item.id);
     if(item.authorshipStatus==="publisher_listed"&&(!item.authorships.length||
       !/^https:\/\//.test(item.authorshipSource||"")))
       throw Error("Authorship evidence is missing for "+item.id);
     if(item.authorshipStatus==="unverified"&&item.authorships.length)
       throw Error("Unverified authors cannot appear for "+item.id);
     if(item.authorships.some(a=>!a.name||typeof a.name!=="string"))
       throw Error("Malformed author entry for "+item.id);
     if(item.affiliationCoverage==="complete"&&!item.authorships.length)
       throw Error("Complete coverage requires authorship mapping: "+item.id);
     if(!item.evidence||item.evidence.reproductionStatus!=="not_reproduced"||
        item.evidence.bibliographicStatus!=="source_linked"||
        item.evidence.affiliationStatus!==item.affiliationCoverage)
       throw Error("Inconsistent evidence status for "+item.id);
     const hasContent=Boolean(item.researchQuestion||item.researchMethod||item.evaluationScope);
     if(hasContent&&!/^https:\/\//.test(item.researchContentSource||""))
       throw Error("Research summary without source for "+item.id);
   }else if(item.publication!==null||item.affiliationCoverage!=="not_applicable"||item.affiliations.length){
     throw Error("Uncited or misplaced author affiliation for "+item.id);
   }
   for(const a of item.affiliations){
     if(item.type!=="paper"||!a.university||!a.country||!/^https:\/\//.test(a.source||""))
       throw Error("Uncited or misplaced author affiliation for "+item.id);
   }
 }
 return data;
}
const api=Object.freeze({normalize,searchCorpus,matches,filter,facets,topicCounts,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.SNNAtlas=api;
})(typeof window!=="undefined"?window:globalThis);
