import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("docs/index.html"),css=read("docs/styles.css");
const home=read("docs/home-research.js"),atlas=read("docs/atlas/corpus.js");
const data=JSON.parse(read("docs/atlas/works.json"));
test("homepage retains research-only discovery and legacy software redirects",()=>{
 assert.match(html,/action="\.\/atlas\/" method="get" role="search"/);
 assert.match(html,/id="resource-grid"/);
 assert.match(html,/class="research-index-note"/);
 assert.match(html,/href="\.\/ecosystem\/"/);
 assert.doesNotMatch(html,/atlas-kind-switch|data-format="resource"/);
 assert.doesNotMatch(home,/function showResource|kind==="resource"|resources=catalog/);
 assert.match(home,/location\.replace\("\.\/ecosystem\/"\)/);
});
test("obsolete homepage components and static datasets are not present",()=>{
 assert.doesNotMatch(html,/section-statement|class="ticker"|class="path-grid"/);
 assert.match(html,/class="home-learning-inner"/);
 for(const p of ["docs/atlas/corpus.json","docs/atlas/metadata.json",
   "docs/atlas/assignments-staging.json","docs/atlas/code-links-staging.json"])
  assert.ok(!existsSync(new URL("../"+p,import.meta.url)),p);
 for(const select of [/\.section-statement\b/,/\.statement-inner\b/,/\.path-card\b/,/\.ticker\b/,/\.atlas-kind\b/])
  assert.doesNotMatch(css,select);
 assert.match(css,/\.portal-search/);
 assert.match(css,/\.resource-grid/);
});
test("395-work canonical IDs and historic inbound deep-link mapping remain stable",()=>{
 assert.equal(data.items.length,395);
 assert.ok(data.items.every(w=>!w.versions&&!w.versionCount&&!w.abstract));
 assert.match(atlas,/convertOldLinks/);
 assert.match(atlas,/n===360\?75/);
 assert.match(atlas,/legacyTopics/);
 assert.match(read("docs/atlas/index.html"),/69<\/strong>/);
 for(const route of ["atlas","ecosystem","learn","experiments"])
  assert.ok(read("docs/sitemap.xml").includes("/.github/"+route+"/"));
});
