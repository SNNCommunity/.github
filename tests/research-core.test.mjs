import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import core from "../docs/research-core.js";
const read=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const data=read("docs/atlas/works.json"),ontology=read("docs/atlas/ontology.json");
const works=data.items;
test("canonical validator enforces 395 unique abstract-free papers and complete ontology",()=>{
 assert.equal(core.validate(data,ontology),data);
 assert.equal(works.filter(x=>x.authorCount>1&&x.authors.length===1).length,0);
 assert.equal(works.filter(x=>x.legacyId).length,394);
 assert.equal(ontology.techniques.filter(x=>x.id.split(".")[0]!==x.domain).length,0);
 assert.equal(works.filter(x=>x.techniques.some(t=>!x.domains.includes(t.split(".")[0]))).length,0);
 const spike=works.find(x=>x.title.startsWith("Spike-HTR:"));
 assert.equal(spike.authors.length,6);
 assert.equal(spike.id,"work-8e70ea8ccf3d62c");
 assert.match(spike.paperUrl,/proceedings\.mlr\.press\/v306\/liang26j\.html/);
 for(const [key,value] of [["abstract","Confidential abstract"],["versions",[{}]],["sourceIndex",42]])
  assert.throws(()=>core.validate({...data,items:works.map((x,i)=>i?x:{...x,[key]:value})},ontology),/Unexpected|Invalid/);
 assert.throws(()=>core.validate({...data,count:396},ontology),/395/);
 assert.throws(()=>core.validate({...data,items:[...works.slice(0,-1),{...works[0]}]},ontology),/duplicate/i);
 assert.throws(()=>core.validate({...data,items:works.map((x,i)=>i?x:{...x,techniques:["D99.T99"]})},ontology),/Unknown concept/);
});
test("6 groups, 13 domains and 69 atomic concepts support cross-dimensional discovery",()=>{
 assert.equal(core.filterWorks(works,{},ontology).length,395);
 const code=core.filterWorks(works,{code:"yes"},ontology);assert.equal(code.length,159);
 assert.equal(core.filterWorks(works,{code:"no"},ontology).length,236);
 for(const domain of ontology.domains){
  const hit=core.filterWorks(works,{domain:domain.id},ontology);
  assert.ok(hit.length>0,domain.id);
  assert.ok(hit.every(x=>x.domains.includes(domain.id)));
 }
 for(const group of ontology.groups){
  const hit=core.filterWorks(works,{group:group.id},ontology);
  assert.ok(hit.length>0,group.id);
  assert.ok(hit.every(x=>x.domains.some(d=>group.domains.includes(d))));
 }
 for(const t of ontology.techniques){
  const hit=core.filterWorks(works,{technique:t.id},ontology);
  assert.ok(hit.length>0,t.id);
  assert.ok(hit.every(x=>x.techniques.includes(t.id)));
 }
 for(const [filter,key] of [["model","model_families"],["method","learning_methods"],
  ["task","tasks"],["modality","modalities"],["platform","platforms"]]){
  const value=ontology.facets[key].find(x=>works.some(w=>w.facets[key].includes(x)));
  const result=core.filterWorks(works,{[filter]:value},ontology);
  assert.ok(result.length>0,filter);
  assert.ok(result.every(w=>w.facets[key].includes(value)));
 }
});
test("title, author, temporal methods and scientific model families are searchable",()=>{
 for(const query of ["Spike-HTR","Xiubo Liang","PLIF","Spiking Transformer","2026 ICML"])
  assert.ok(core.filterWorks(works,{query},ontology).length>0,query);
 assert.equal(core.filterWorks(works,{query:"never-ever-present-zzzz"},ontology).length,0);
 const dual=core.filterWorks(works,{topics:["D04","D03"],mode:"all"},ontology);
 assert.ok(dual.every(x=>x.domains.includes("D04")&&x.domains.includes("D03")));
 assert.ok(core.filterWorks(works,{topics:["D04","D03"],mode:"any"},ontology).length>=dual.length);
 assert.equal(core.filterWorks(works,{source:"not_identified"},ontology).length,48);
 assert.equal(core.filterWorks(works,{source:"publisher_specific_page_not_independently_rechecked"},ontology).length,279);
 const codeSearch=core.filterWorks(works,{query:"Spike-HTR",code:"yes"},ontology);
 assert.equal(codeSearch.length,1);
});
test("topic counts honor other facets and distinguish modalities from methods",()=>{
 const opts={query:"spiking",year:"2026",topics:["D01"]};
 const base=core.filterWorks(works,{...opts,topics:[]},ontology);
 const result=core.topicCounts(works,opts,ontology);
 assert.equal(result.total,base.length);
 for(const d of ontology.domains)
  assert.equal(result.counts.get(d.id)||0,base.filter(x=>x.domains.includes(d.id)).length);
 const event=core.filterWorks(works,{modality:"Event camera/DVS"},ontology);
 const spike=core.filterWorks(works,{modality:"Spike camera"},ontology);
 assert.ok(event.length>0&&spike.length>0);
 assert.notDeepEqual(event.map(x=>x.id),spike.map(x=>x.id));
});
test("home and Atlas share same core but never expose private abstract data",()=>{
 const home=readFileSync(new URL("../docs/home-research.js",import.meta.url),"utf8");
 const atlas=readFileSync(new URL("../docs/atlas/corpus.js",import.meta.url),"utf8");
 for(const s of [home,atlas]){
  assert.match(s,/filterWorks/);assert.match(s,/validate/);
  assert.doesNotMatch(s,/localStorage|sessionStorage|privateLibrary|abstractDisplayText/);
 }
 assert.equal(core.displayTitle("A$^2$SG"),"A²SG");
});

test("semantic invariants reject mis-parented concepts and invalid normalized DOI",()=>{
 const incorrect={...ontology,techniques:ontology.techniques.map((t,i)=>i? t:{...t,domain:"D08"})};
 assert.throws(()=>core.validate(data,incorrect),/Invalid technical concept parent/);
 const swapped={...data,items:works.map((x,i)=>i?x:{...x,techniques:["D12.T01"]})};
 assert.throws(()=>core.validate(swapped,ontology),/Technical concept domain mismatch/);
 const raw=works.findIndex(x=>x.doi);
 const bad={...data,items:works.map((x,i)=>i===raw?{...x,doi:x.doi+"/full"}:x)};
 assert.throws(()=>core.validate(bad,ontology),/Invalid or duplicate public work/);
});

test("prolific-author discovery counts canonical works exactly and keeps name variants together",()=>{
 const leaders=core.authorIndex(works,10);
 assert.equal(leaders.length,30);
 assert.equal(leaders[0].name,"Zhaofei Yu");
 assert.equal(leaders[0].papers,47);
 assert.equal(leaders[1].papers,37);
 assert.equal(leaders[2].papers,34);
 assert.equal(leaders.at(-1).papers,10);
 assert.equal(core.authorIndex(works,1).length,1147);
 const union=new Set();
 for(const a of leaders){
  const hits=core.filterWorks(works,{author:a.key},ontology);
  assert.equal(hits.length,a.papers,a.name);
  assert.ok(hits.every(w=>w.authors.some(n=>core.authorKey(n)===a.key)),a.name);
  hits.forEach(w=>union.add(w.id));
 }
 assert.equal(union.size,181);
 assert.equal(core.filterWorks(works,{author:"zhaofei yu"},ontology).length,47);
 assert.equal(core.filterWorks(works,{author:"Huajin Tang"},ontology).length,17);
 assert.equal(core.filterWorks(works,{author:"HuaJin Tang"},ontology).length,17);
 assert.equal(core.filterWorks(works,{author:"BO xu"},ontology).length,11);
 assert.equal(core.filterWorks(works,{author:"Zhaofei"},ontology).length,0,"exact match, not substring");
 assert.equal(core.filterWorks(works,{author:"not an indexed author"},ontology).length,0);
 const selected=core.filterWorks(works,{author:"zhaofei yu",year:"2025"},ontology);
 assert.ok(selected.length>0&&selected.length<47);
 assert.ok(selected.every(w=>w.year===2025&&w.authors.some(n=>core.authorKey(n)==="zhaofei yu")));
});
test("author facet is present in both site entrypoints and remains abstract-free",()=>{
 const home=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
 const atlas=readFileSync(new URL("../docs/atlas/index.html",import.meta.url),"utf8");
 const homeJs=readFileSync(new URL("../docs/home-research.js",import.meta.url),"utf8");
 const atlasJs=readFileSync(new URL("../docs/atlas/corpus.js",import.meta.url),"utf8");
 assert.match(home,/id="atlas-author"/);
 assert.match(atlas,/id="author"/);
 assert.match(atlas,/id="author-featured"/);
 assert.match(atlas,/id="author-more-list"/);
 assert.match(homeJs,/authorIndex\(papers,10\)/);
 assert.match(atlasJs,/authorIndex\(works,10\)/);
 for(const js of [homeJs,atlasJs])assert.doesNotMatch(js,/privateLibrary|abstractDisplayText/);
});
