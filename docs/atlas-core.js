/* Pure, testable SNN Research Atlas filtering. No DOM, storage or network access. */
(function(root) {
  "use strict";
  const norm=v=>String(v??"").toLocaleLowerCase("en").trim();
  function matches(item,options={}) {
    const f={topic:"all",format:"all",year:"all",venueType:"all",venue:"all",country:"all",university:"all",query:"",...options};
    const pub=item.publication,affs=item.affiliations||[];
    if(f.topic!=="all" && !(item.topics||[]).includes(f.topic))return false;
    if(f.format==="paper" && item.type!=="paper")return false;
    if(f.format==="resource" && item.type==="paper")return false;
    if(f.year!=="all" && String(pub?.year)!==f.year)return false;
    if(f.venueType!=="all" && pub?.kind!==f.venueType)return false;
    if(f.venue!=="all" && pub?.venue!==f.venue)return false;
    if(f.country==="unknown") {
      if(affs.length!==0)return false;
    } else if(f.country!=="all" && !affs.some(a=>a.country===f.country))return false;
    if(f.university!=="all" && !affs.some(a=>a.university===f.university
      && (f.country==="all"||f.country===a.country)))return false;
    if(norm(f.query)) {
      const corpus=[item.title,item.publisher,item.description,item.doi,item.type,
        ...(item.topics||[]),pub?.venue,pub?.year,
        ...affs.flatMap(a=>[a.university,a.country])].map(norm).join(" ");
      if(!corpus.includes(norm(f.query)))return false;
    }
    return true;
  }
  function filter(items,options={}) {
    const list=items.filter(x=>matches(x,options));
    const sort=options.sort||"recent";
    list.sort((a,b)=>{
      if(sort==="title")return a.title.localeCompare(b.title,"en");
      const ay=a.publication?.year??-1,by=b.publication?.year??-1;
      const delta=sort==="oldest"?(ay===-1?Infinity:ay)-(by===-1?Infinity:by):by-ay;
      return delta||a.title.localeCompare(b.title,"en");
    });
    return list;
  }
  function facets(items) {
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
  function validate(data) {
    if(data?.schemaVersion!==2 || !Array.isArray(data.items) || !Array.isArray(data.topics))
      throw Error("Unsupported research catalog schema");
    const topics=new Set(data.topics.map(t=>t.id)),ids=new Set();
    if(topics.size!==data.topics.length)throw Error("Duplicate research topic");
    for(const item of data.items){
      if(!item.id||ids.has(item.id))throw Error("Duplicate or empty atlas identifier");
      ids.add(item.id);
      if(!item.title||!/^https:\/\//.test(item.url)||item.verification!=="indexed_not_reproduced")
        throw Error("Invalid atlas entry "+item.id);
      if(!Array.isArray(item.topics)||!item.topics.length||item.topics.some(t=>!topics.has(t)))
        throw Error("Invalid research topics for "+item.id);
      if(item.type==="paper" && (!item.publication||!Number.isInteger(item.publication.year)
        ||!["Conference","Journal"].includes(item.publication.kind)
        ||!item.publication.venue||!/^https:\/\//.test(item.bibliographySource||"")))
        throw Error("Invalid bibliography for "+item.id);
      if(item.type!=="paper" && item.publication!==null)
        throw Error("Software metadata must not imitate a paper "+item.id);
      for(const a of item.affiliations||[]){
        if(item.type!=="paper"||!a.university||!a.country||!/^https:\/\//.test(a.source||""))
          throw Error("Uncited or misplaced author affiliation for "+item.id);
      }
    }
    return data;
  }
  const api=Object.freeze({matches,filter,facets,validate});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.SNNAtlas=api;
})(typeof window!=="undefined"?window:globalThis);
