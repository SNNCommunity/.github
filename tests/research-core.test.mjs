import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import core from "../docs/research-core.js";
const read=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const data=read("docs/atlas/works.json"),ontology=read("docs/atlas/ontology.json");
const works=data.items;
test("canonical validator enforces 395 unique abstract-free papers and complete ontology",()=>{
 assert.equal(core.validate(data,ontology),data);
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
 assert.equal(core.filterWorks(works,{source:"not_identified"},ontology).length,50);
 assert.equal(core.filterWorks(works,{source:"publisher_specific_page_not_independently_rechecked"},ontology).length,140);
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
