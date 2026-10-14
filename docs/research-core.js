/* Shared, framework-free search and validation for the public 395-work collection.
   Both the homepage and /atlas/ use these exact inclusion and sorting rules. */
(function(root){"use strict";
const normalize=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
 .toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
const WORK_FIELDS=new Set(["sourceIndex","title","year","venue","authors","authorCount",
 "doi","topics","paperUrl","codeUrl","sourceStatus","sourceWarnings",
 "abstractDetailsIncluded","id","versionCount","versions","editorialSourceChecked20261014"]);
const VERSION_FIELDS=new Set(["sourceIndex","title","year","venue","authors","authorCount",
 "doi","topics","paperUrl","codeUrl","sourceStatus","sourceWarnings","abstractDetailsIncluded","id"]);
const TYPES=new Set(["publisher_specific_page_not_independently_rechecked",
 "conference_index_or_aggregate_not_paper_specific","not_identified"]);
function sourceLabel(s){
 if(s==="publisher_specific_page_not_independently_rechecked")return "Publisher-specific source (source-listed)";
 if(s==="conference_index_or_aggregate_not_paper_specific")return "Venue index / aggregate";
 return "Paper-specific source unresolved";
}
function validate(data){
 if(data?.schemaVersion!=="v13-public-395-works"||data.count!==395||
   !Array.isArray(data.items)||data.items.length!==395)throw Error("Expected exactly 395 canonical works");
 const ids=new Set(),titles=new Set(),sourceIndices=new Set();let versions=0;
 for(const x of data.items){
   const title=normalize(x.title);
   if(Object.keys(x).some(k=>!WORK_FIELDS.has(k)))throw Error("Unexpected public research field in "+x.id);
   if(typeof x.id!=="string"||ids.has(x.id)||!title||titles.has(title)||
      !Array.isArray(x.authors)||!x.authors.length||!Number.isInteger(x.authorCount)||
      x.authorCount<x.authors.length||!Array.isArray(x.topics)||!TYPES.has(x.sourceStatus)||
      typeof x.paperUrl!=="string"||!/^https:\/\//.test(x.paperUrl)||
      x.abstractDetailsIncluded!==false||"abstract" in x||"abstractDisplayText" in x||
      "abstractSummaryZh" in x||"abstractOriginal" in x)
     throw Error("Invalid or duplicate public research record "+x.id);
   ids.add(x.id);titles.add(title);
   if(x.versionCount!==1&&x.versionCount!==2)throw Error("Invalid version family "+x.id);
   if(x.versionCount===2&&(!Array.isArray(x.versions)||x.versions.length!==2))
     throw Error("Missing version lineage "+x.id);
   const entries=x.versionCount===2?x.versions:[x];
   for(const v of entries){
     if(v!==x&&Object.keys(v).some(k=>!VERSION_FIELDS.has(k)))
       throw Error("Unexpected public version field "+x.id);
     if(!Number.isInteger(v.sourceIndex)||v.sourceIndex<0||v.sourceIndex>=396||
        sourceIndices.has(v.sourceIndex))throw Error("Duplicate or invalid source version index "+x.id);
     sourceIndices.add(v.sourceIndex);
   }
   versions+=x.versionCount;
 }
 if(versions!==396||sourceIndices.size!==396||data.abstractsStored!==0)throw Error("Public version lineage or abstract policy mismatch");
 return data;
}
function searchText(x,names){
 const list=[x.title,...(x.authors||[]),x.doi,x.year,x.venue,
  ...(x.topics||[]).flatMap(t=>[t,names?.get(t)||""])];
 return normalize(list.filter(x=>x!=null).join(" "));
}
function filterWorks(items,opts={},names=new Map()){
 const s={query:"",topics:[],mode:"any",year:"all",venue:"all",source:"all",code:"all",sort:"recent",...opts};
 const ts=s.topics||[],terms=normalize(s.query).split(" ").filter(Boolean);
 const matches=items.filter(x=>{
   if(ts.length&&(s.mode==="all"?!ts.every(t=>x.topics.includes(t)):!ts.some(t=>x.topics.includes(t))))return false;
   if(s.year&&s.year!=="all"&&String(x.year)!==String(s.year))return false;
   if(s.venue&&s.venue!=="all"&&x.venue!==s.venue)return false;
   if(s.source&&s.source!=="all"&&x.sourceStatus!==s.source)return false;
   if(s.code&&s.code!=="all"&&(s.code==="yes"?!x.codeUrl:!!x.codeUrl))return false;
   const text=searchText(x,names);
   return terms.every(t=>text.includes(t));
 });
 matches.sort((a,b)=>s.sort==="title"?a.title.localeCompare(b.title,"en"):
   s.sort==="oldest"?(a.year||9999)-(b.year||9999)||a.title.localeCompare(b.title,"en"):
   (b.year||-1)-(a.year||-1)||a.title.localeCompare(b.title,"en"));
 return matches;
}
function topicCounts(items,opts,names){
 const base=filterWorks(items,{...opts,topics:[]},names),counts=new Map();
 for(const x of base)for(const t of x.topics)counts.set(t,(counts.get(t)||0)+1);
 return {total:base.length,counts};
}
const api=Object.freeze({normalize,validate,searchText,filterWorks,topicCounts,sourceLabel});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.SNNResearch=api;
})(typeof window!=="undefined"?window:globalThis);
