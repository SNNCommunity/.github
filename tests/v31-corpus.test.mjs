import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>JSON.parse(readFileSync(p,"utf8"));
const corpus=load("docs/atlas/corpus.json");
const metadata=load("docs/atlas/metadata.json");
test("V31 catalog matches the source snapshot and metadata projection",()=>{
 assert.equal(corpus.recordCount,396);
 assert.equal(corpus.workCount,395);
 assert.equal(corpus.records.length,396);
 assert.equal(metadata.bitmasks.length,396);
 assert.equal(metadata.firstAuthors.length,396);
 assert.equal(metadata.editorialOnlyIndices.length,24);
 assert.equal(metadata.distinctWorkCount,395);
 assert.equal(metadata.topics.length,11);
 assert.ok(corpus.records[0][0].startsWith("Spike-HTR:"));
 assert.ok(corpus.records[75][0].startsWith("Spikingformer: A Key Foundation Model"));
 assert.ok(corpus.records[360][0].startsWith("Spikingformer: Spike-driven Residual"));
 assert.deepEqual(metadata.sameWorkPairs,[[75,360]]);
 assert.equal(new Set(corpus.records.map(r=>r[0].toLowerCase())).size,396);
 assert.ok(metadata.firstAuthors.every(x=>typeof x==="string"&&x.length>1));
 assert.ok(metadata.bitmasks.every(n=>Number.isInteger(n)&&n>=0&&n<(1<<11)));
});
test("V31 distinguishes source links and 24 non-original summaries",()=>{
 const missing=new Set(metadata.editorialOnlyIndices);
 assert.equal(missing.size,24);
 assert.equal(396-missing.size,372);
 const doi=Object.entries(metadata.doiAsProvided);
 assert.equal(doi.length,92);
 const fallback=Object.keys(metadata.sourceFallback);
 assert.equal(fallback.length,25);
 let direct=0;
 for(const [i,row] of corpus.records.entries()){
   assert.equal(row.length,5);
   assert.ok(row[0].length>8);
   assert.ok(Number.isInteger(row[1]));
   if(row[3]){assert.match(row[3],/^https:\/\//);direct++;}
   else assert.match(metadata.sourceFallback[i],/^https:\/\//);
 }
 assert.equal(direct+fallback.length,396);
 assert.equal(metadata.yearOverrides[101],2026);
 assert.equal(metadata.yearOverrides[311],0);
});
test("No publisher-authored original abstracts are mirrored in the public files",()=>{
 const html=readFileSync("docs/atlas/index.html","utf8");
 const json=readFileSync("docs/atlas/corpus.json","utf8");
 assert.doesNotMatch(json,/"original_abstract"|"abstractOriginal"|"abstractDisplayText"/);
 assert.match(html,/stored author abstracts remain in the private research package/);
 assert.match(readFileSync("docs/index.html","utf8"),/Open the full V31 corpus/);
 assert.match(readFileSync("docs/sitemap.xml","utf8"),/\.github\/atlas\//);
});
