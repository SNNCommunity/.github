import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import core from "../docs/research-core.js";
const works=JSON.parse(readFileSync(new URL("../docs/atlas/works.json",import.meta.url),"utf8"));
const catalog=JSON.parse(readFileSync(new URL("../docs/resources.json",import.meta.url),"utf8"));
const names=new Map(catalog.topics.map(x=>[x.id,x.label]));
test("shared filter validates exact canonical 395-work source without paper abstracts",()=>{
 assert.equal(core.validate(works),works);
 assert.equal(core.filterWorks(works.items,{},names).length,395);
 assert.throws(()=>core.validate({...works,items:works.items.map((x,i)=>i?x:{...x,originalAbstract:"text copied from a publisher"})}),/Unexpected public research field/);
 assert.throws(()=>core.validate({...works,items:works.items.map((x,i)=>i?x:{...x,sourceIndex:works.items[1].sourceIndex})}),/Duplicate or invalid source version index/);
 assert.equal(core.filterWorks(works.items,{topics:["robotics-embodied"]},names).length>0,true);
 assert.throws(()=>core.validate({...works,count:396}),/395/);
 assert.throws(()=>core.validate({...works,items:[...works.items.slice(0,-1),{...works.items[0]}]}),/duplicate/i);
 assert.throws(()=>core.validate({...works,items:works.items.map((x,i)=>i?x:{...x,abstract:"Private research abstract"})}),/Invalid|Unexpected/);
});
test("homepage and full Atlas use shared search semantics for representative public queries",()=>{
 const variants=[
 {query:"Spike-HTR"},{query:"Xiubo Liang"},{query:"2026 ICML"},{query:"neuron dynamics"},
 {query:"Transformer",year:"2025"},{source:"publisher_specific_page_not_independently_rechecked"},
 {source:"conference_index_or_aggregate_not_paper_specific"},
 {source:"not_identified"},{code:"yes"},{code:"no"},
 {topics:["deep-architectures"]},{topics:["robotics-embodied","deep-architectures"],mode:"all"},
 {venue:"ICML",year:"2026"},{sort:"oldest"},{sort:"title"}
 ];
 for(const filters of variants){
   const a=core.filterWorks(works.items,filters,names);
   const b=core.filterWorks(works.items,{...filters,year:filters.year||"all",venue:filters.venue||"all",source:filters.source||"all",code:filters.code||"all"},names);
   assert.deepEqual(a.map(x=>x.id),b.map(x=>x.id),JSON.stringify(filters));
 }
 assert.equal(core.filterWorks(works.items,{source:"not_identified"},names).length,50);
 assert.equal(core.filterWorks(works.items,{source:"publisher_specific_page_not_independently_rechecked"},names).length,140);
 assert.equal(core.filterWorks(works.items,{source:"conference_index_or_aggregate_not_paper_specific"},names).length,205);
 assert.equal(core.filterWorks(works.items,{query:"unfindable-research-term-zzzz"},names).length,0);
});
test("shared topic counts remain conditional on non-topic search and metadata facets",()=>{
 const opts={year:"2026",query:"spiking",topics:["neuron-dynamics"]};
 const base=core.filterWorks(works.items,{...opts,topics:[]},names);
 const result=core.topicCounts(works.items,opts,names);
 assert.equal(result.total,base.length);
 for(const t of catalog.topics)assert.equal(result.counts.get(t.id)||0,base.filter(x=>x.topics.includes(t.id)).length);
});
test("both public pages depend on one shared core and no separate abstract library",()=>{
 const home=readFileSync(new URL("../docs/home-research.js",import.meta.url),"utf8");
 const explorer=readFileSync(new URL("../docs/atlas/corpus.js",import.meta.url),"utf8");
 const root=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
 const sub=readFileSync(new URL("../docs/atlas/index.html",import.meta.url),"utf8");
 for(const source of [home,explorer]){
   assert.match(source,/research\.filterWorks/);
   assert.match(source,/research\.validate/);
   assert.doesNotMatch(source,/localStorage|sessionStorage|privateLibrary|abstractDisplayText\s*:/);
 }
 assert.match(root,/research-core\.js/);assert.match(sub,/research-core\.js/);
});

test("publication facets use canonical labels and corrected ICCV citation",()=>{
 const v=works.items.map(x=>x.venue);
 assert.equal(v.filter(x=>x==="NeurIPS").length,66);
 assert.ok(!v.includes("Neurips"));
 assert.ok(!v.some(x=>x.endsWith(",")));
 const paper=works.items.find(x=>x.title==="Temporal-wise Attention Spiking Neural Networks for Event Streams Classification");
 assert.ok(paper);
 assert.equal(paper.venue,"ICCV");
 assert.equal(paper.year,2021);
 assert.match(paper.paperUrl,/ICCV2021/);
 assert.equal(works.items.length,395);
 assert.equal(works.items.reduce((n,x)=>n+x.versionCount,0),396);
});
test("readable scientific title presentation does not mutate canonical metadata",()=>{
 assert.equal(core.displayTitle("A$^2$SG"),"A²SG");
 assert.equal(core.displayTitle("O($\\mathcal{O}(T)$)"),"O(O(T))");
 assert.equal(core.displayTitle("complexity $O(L)$"),"complexity O(L)");
 assert.equal(works.items.find(x=>x.title.startsWith("A$^2$SG")).title.startsWith("A$^2$SG"),true);
});
