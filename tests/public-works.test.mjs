import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const data=JSON.parse(read("docs/atlas/works.json"));
const ontology=JSON.parse(read("docs/atlas/ontology.json"));
test("single canonical 395-work public corpus and atomic research vocabulary",()=>{
 assert.equal(data.schemaVersion,"atomic-public-395-v1");
 assert.equal(data.items.length,395);
 assert.equal(new Set(data.items.map(x=>x.id)).size,395);
 assert.equal(ontology.groups.length,6);
 assert.equal(ontology.domains.length,13);
 assert.equal(ontology.techniques.length,69);
 assert.equal(new Set(ontology.techniques.map(x=>x.id)).size,69);
 assert.equal(new Set(data.items.flatMap(x=>x.techniques)).size,69);
 assert.equal(data.items.reduce((n,x)=>n+x.techniques.length,0),280);
 assert.equal(data.items.filter(x=>x.techniques.length).length,226);
 assert.equal(data.items.filter(x=>x.codeUrl).length,159);
 assert.equal(data.items.filter(x=>x.resourceType==="repository").length,153);
 assert.equal(data.items.filter(x=>x.legacyId).length,394);
 assert.ok(data.items.every(w=>w.authorCount===w.authors.length));
 assert.ok(ontology.techniques.every(t=>t.id.startsWith(t.domain+".")&&t.definition&&t.exclude));
 assert.ok(data.items.every(w=>w.techniques.every(t=>w.domains.includes(t.split(".")[0]))));
 assert.equal(data.items.filter(x=>x.doi).length,92);
 assert.equal(data.items.find(x=>x.title.startsWith("Spikingformer:")).title,
   "Spikingformer: A Key Foundation Model for Spiking Neural Networks");
});
test("public files carry no private abstracts, evidence phrases or historic version records",()=>{
 const raw=read("docs/atlas/works.json");
 for(const [i,w] of data.items.entries()){
  assert.ok(w.title?.length>6,"Missing title "+i);
  assert.ok(Array.isArray(w.authors)&&w.authors.length>0,"Missing authors "+i);
  assert.ok(w.paperUrl?.startsWith("https://"),"Missing publication source "+i);
  assert.ok(/^D(0[1-9]|1[0-3])$/.test(w.primaryDomain),"Invalid primary domain "+i);
  assert.ok(w.domains.includes(w.primaryDomain),"Primary must be among active research domains "+i);
  for(const name of ["versions","versionCount","sourceIndex","abstract","abstractOriginal","abstractEvidence",
   "originalAbstract","abstractSummaryZh","abstractDetailsIncluded"])
   assert.ok(!(name in w),"Retired or private field: "+name+" in "+w.id);
 }
 assert.doesNotMatch(raw,/"abstract"\s*:|"abstractEvidence"\s*:|abstractOriginal|source_grounded_editorial_abstract/);
 for(const p of ["docs/atlas/corpus.json","docs/atlas/metadata.json","docs/atlas/assignments-staging.json",
   "docs/atlas/code-links-staging.json"])assert.ok(!existsSync(p),"Unexpected staging/obsolete dataset "+p);
});
test("bibliographic source statuses remain transparent",()=>{
 const n=data.items.reduce((o,w)=>(o[w.sourceStatus]=(o[w.sourceStatus]||0)+1,o),{});
 assert.equal(n.publisher_specific_page_not_independently_rechecked,279);
 assert.equal(n.conference_index_or_aggregate_not_paper_specific,68);
 assert.equal(n.not_identified,48);
 assert.equal(data.items.length,Object.values(n).reduce((a,b)=>a+b,0));
});
