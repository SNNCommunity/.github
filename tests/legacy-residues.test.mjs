import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=read("docs/index.html");
const css=read("docs/styles.css");
const home=read("docs/home-research.js");
const atlas=read("docs/atlas/corpus.js");
const data=JSON.parse(read("docs/atlas/works.json"));
test("home contains one research discovery UI and routes software to its own workspace",()=>{
 assert.match(html,/action="\.\/atlas\/" method="get" role="search"/);
 assert.match(html,/id="resource-grid"/);
 assert.match(html,/class="research-index-note"/);
 assert.match(html,/href="\.\/ecosystem\/"/);
 assert.doesNotMatch(html,/class="atlas-kind-switch"|data-format="resource"|Tools &amp; guides/);
 assert.doesNotMatch(home,/function showResource|let papers=\[\],resources=|kind==="resource"|resources=catalog/);
 assert.match(home,/location\.replace\("\.\/ecosystem\/"\)/);
});
test("retired homepage promotional and duplicate-learning components have no live styles",()=>{
 assert.doesNotMatch(html,/section-statement|class="ticker"|class="path-grid"|class="hero-visual" aria-label="Illustration/);
 assert.match(html,/class="home-learning-inner"/);
 for(const selector of [/\.section-statement\b/,/\.statement-inner\b/,/\.path-card\b/,/\.ticker\b/,/\.visual-heading\b/,/\.atlas-kind\b/])
   assert.doesNotMatch(css,selector,selector.source+" is a retired selector");
 for(const required of [".portal-search",".resource-grid",".atlas-card-actions",".lab-layout",".home-learning-inner"])
   assert.ok(css.includes(required),required+" style must remain");
});
test("catalog and compatibility routes survive cleanup",()=>{
 assert.equal(data.items.length,395);
 assert.equal(data.items.reduce((n,x)=>n+x.versionCount,0),396);
 assert.equal(data.abstractsStored,0);
 assert.ok(data.items.every(x=>!x.abstract&&!x.originalAbstract));
 assert.match(home,/research\.filterWorks/);
 assert.match(home,/research\.validate/);
 assert.match(atlas,/migrateLegacyRecordURL/);
 const root=read("docs/sitemap.xml");
 for(const route of ["atlas","ecosystem","learn","experiments"])
   assert.ok(root.includes("/.github/"+route+"/"),route);
 assert.equal(JSON.parse(read("docs/resources.json")).items.filter(x=>x.type!=="paper").length,9);
});
