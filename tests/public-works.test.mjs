import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const db=JSON.parse(read("docs/atlas/works.json"));
const sourceCount=Object.groupBy?Object.groupBy(db.items,x=>x.sourceStatus):null;
test("public corpus contains exactly 395 unique research works",()=>{
 assert.equal(db.schemaVersion,"v13-public-395-works");
 assert.equal(db.count,395);
 assert.equal(db.items.length,395);
 assert.equal(new Set(db.items.map(x=>x.id)).size,395);
 assert.equal(db.items.reduce((n,x)=>n+(x.versionCount||1),0),396);
 assert.equal(db.items.filter(x=>x.versionCount===2).length,1);
 const merged=db.items.find(x=>x.versionCount===2);
 assert.equal(merged.id,"work-spikingformer-spike-driven-residual-learning");
 assert.equal(merged.versions.length,2);
 assert.match(merged.title,/Key Foundation Model/);
 assert.match(merged.versions[1].title,/Spike-driven Residual Learning/);
 assert.equal(db.items.filter(x=>x.editorialSourceChecked20261014).length,24);
});
test("every public record has source-linked metadata with zero abstract content",()=>{
 for(const [i,x] of db.items.entries()){
   assert.ok(x.title?.length>6,"missing title "+i);
   assert.ok(x.authors?.length&&x.authorCount>=1,"missing author "+i);
   assert.ok(Array.isArray(x.topics),"missing topic array "+i);
   assert.ok(Number.isInteger(x.year)||x.year===null,"invalid year "+i);
   assert.match(x.paperUrl,/^https:\/\//,"missing paper source "+i);
   assert.equal(x.abstractDetailsIncluded,false);
   assert.ok(!("abstract" in x)&&!("abstractDisplayText" in x)&&!("abstractSummaryZh" in x));
 }
 assert.doesNotMatch(read("docs/atlas/works.json"),/abstractOriginal|abstractDisplayText|abstractSummaryZh|original_abstract|source_grounded_editorial_abstract/);
 assert.equal(db.abstractsStored,0);
 const counts=db.items.reduce((o,x)=>(o[x.sourceStatus]=(o[x.sourceStatus]||0)+1,o),{});
 assert.equal(counts.publisher_specific_page_not_independently_rechecked,140);
 assert.equal(counts.conference_index_or_aggregate_not_paper_specific,205);
 assert.equal(counts.not_identified,50);
});
test("old version database, local upload widgets and ordinal links are absent",()=>{
 for(const path of ["docs/atlas/corpus.json","docs/atlas/metadata.json"])
   assert.ok(!existsSync(path),"obsolete legacy public file remains: "+path);
 const html=read("docs/atlas/index.html");
 const js=read("docs/atlas/corpus.js");
 assert.match(html,/395 unique SNN research works/);
 assert.doesNotMatch(html,/396|private-file|private-clear|V31 JSON|id="unit"|id="abstract"/);
 assert.doesNotMatch(js,/privateLibrary|file\.text\(|record=|corpus\.json|metadata\.json|localStorage|sessionStorage/);
 assert.match(js,/works\.json/);
 assert.match(js,/search/);
 assert.match(read("docs/index.html"),/Explore all 395 papers/);
});
