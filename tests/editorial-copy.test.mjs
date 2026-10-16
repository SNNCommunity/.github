import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const records=JSON.parse(read("docs/resources.json")).items.filter(x=>x.type==="paper");
const works=JSON.parse(read("docs/atlas/works.json")).items;
test("visitor-facing research writing avoids previous repetitive explanations",()=>{
 const home=read("docs/index.html"),atlas=read("docs/atlas/index.html"),
       cards=read("docs/home-research.js"),record=read("docs/atlas/corpus.js");
 for(const phrase of ["Every strong community begins with something useful",
  "a maintainable research index, and independently reviewable SNN experiments",
  "395 unique papers, zero public abstracts"])assert.ok(!home.includes(phrase),phrase);
 for(const phrase of ["One work, one record.","FINAL 395-WORK COLLECTION",
  "Abstracts republished in the public catalog","This catalog provides source-listed bibliographic information"])
  assert.ok(!atlas.includes(phrase),phrase);
 assert.ok(!cards.includes("No abstract text is mirrored"));
 assert.ok(!cards.includes("Not independently reproduced."));
 assert.ok(!record.includes("Editorial and scientific evidence boundary"));
 assert.equal(works.length,395);
 assert.equal(works.filter(x=>x.codeUrl).length,106);
 assert.match(atlas,/106<\/strong><span>Entries with code links/);
});
test("ten generated research pages retain methods but avoid repetitive AI QA notes",()=>{
 assert.equal(records.length,10);
 for(const paper of records){
   const page=read("docs/papers/"+paper.id+"/index.html");
   assert.match(page,/id="research"/);assert.match(page,/id="sources"/);
   assert.match(page,/Research notes based on the linked publication|No method notes are available yet/);
   for(const phrase of ["Editorial synthesis from the original publication",
    "No SNNCommunity task-level benchmark or energy study is implied",
    "Curated, non-exhaustive, independent",
    "This list is not a complete author-to-institution audit"])
      assert.ok(!page.includes(phrase),paper.id+" still contains "+phrase);
   const block=page.match(/<div class="paper-source-links">([\s\S]*?)<\/div>/);
   assert.ok(block,paper.id+" missing source links");
   const links=[...block[1].matchAll(/href="([^"]+)"/g)].map(x=>x[1]);
   assert.equal(new Set(links).size,links.length,paper.id+" duplicates a source button");
 }
});
test("copy fixes are maintained by the generator, not only the committed HTML",()=>{
 const gen=read("scripts/build-paper-pages.mjs");
 assert.match(gen,/const sourceLinks=/);
 assert.match(gen,/Research notes based on the linked publication/);
 assert.doesNotMatch(gen,/paper-side|not the verbatim abstract|No SNNCommunity task-level benchmark/);
 const evaluation=records.map(x=>x.evaluationScope||"").join(" ");
 assert.doesNotMatch(evaluation,/not this catalog|not been independently reproduced here|author-reported measurements/);
});
