import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('docs/index.html'),js=read('docs/app.js'),css=read('docs/styles.css'),
  catalog=JSON.parse(read('docs/resources.json')),profile=read('profile/README.md');
test('production files, metadata and required controls are present',()=>{
 for(const p of ['docs/paper.css','scripts/build-paper-pages.mjs','docs/papers/plif-2021/index.html','docs/index.html','docs/app.js','docs/neuron-core.js','docs/resources.json',
  'docs/atlas-core.js','docs/styles.css','docs/favicon.svg','docs/404.html','docs/og-card.svg','docs/.nojekyll'])
  assert.ok(existsSync(new URL('../'+p,import.meta.url)),p);
 for(const id of ['lif-canvas','compare-if','if-count','spike-count','lif-rate','if-rate',
  'experiment-summary','export-csv','export-png','share-lab','resource-grid','resource-search'])
  assert.ok(html.includes('id="'+id+'"'),id+' missing');
 assert.match(html,/rel="canonical"/);
 assert.match(html,/application\/ld\+json/);
 assert.match(html,/twitter:card/);
 assert.match(html,/aria-describedby="experiment-summary model-summary"/);
 assert.match(html,/id="atlas-active-filters"/);
 assert.match(html,/id="atlas-advanced"/);
 const record=read('docs/papers/plif-2021/index.html');
 assert.match(record,/Incorporating Learnable Membrane Time Constant/);
 assert.match(record,/not the original paper abstract/);
 assert.match(record,/Not independently reproduced/);
});
test('open source provenance entries use unique structured records',()=>{
 assert.equal(catalog.schemaVersion,2);
 assert.ok(catalog.items.length>=22);
 assert.equal(new Set(catalog.items.map(x=>x.id)).size,catalog.items.length);
 for(const x of catalog.items){
  assert.match(x.url,/^https:\/\//);
  assert.equal(x.verification,'indexed_not_reproduced');
  assert.equal(typeof x.description,'string');
  assert.ok('license' in x&&'licenseUrl' in x&&'doi' in x&&'code' in x);
 }
 const doi=catalog.items.filter(x=>x.type==='paper').map(x=>x.doi);
 for(const id of ['10.1109/JPROC.2023.3308088','10.1109/MSP.2019.2931595','10.1109/TPAMI.2020.3008413'])assert.ok(doi.includes(id));
 assert.equal(catalog.topics.length,11);
 assert.ok(catalog.items.filter(x=>x.type==='paper').length>=13);
 assert.ok(catalog.items.some(x=>(x.affiliations||[]).some(a=>a.country==='France')));
});
test('no abandoned V2/V3 assets and no invented evidence',()=>{
 for(const p of ['DESIGN.md','SETUP.md','assets/hero-dark.svg','assets/hero-light.svg','assets/logo-mark.svg'])
   assert.ok(!existsSync(new URL('../'+p,import.meta.url)),p);
 assert.match(profile,/Explore SNN Community/);
 assert.match(html,/not benchmark or biological evidence/i);
 assert.match(html,/not independently certified|not scientific verification|not benchmark/i);
 assert.match(html,/founding stage/i);
});
test('progressive enhancement and WCAG-oriented interaction styles',()=>{
 assert.match(html,/<noscript>/);
 assert.match(html,/Model specification/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(css,/@media \(max-width: 560px\)/);
 assert.match(js,/fetch\("\.\/resources\.json"\)/);
 assert.match(js,/\.textContent/);
 assert.match(js,/function shareURL\(\)/);
 assert.match(js,/function toCSV\(main,other\)/);
});

test('share preview and avatar are real PNG binaries with specified dimensions',()=>{
 for(const [path,width,height] of [['docs/social-card.png',1200,630],['docs/avatar.png',512,512]]){
   const data=readFileSync(new URL('../'+path,import.meta.url));
   assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(data.readUInt32BE(16),width);
   assert.equal(data.readUInt32BE(20),height);
 }
 assert.match(html,/og:image" content="https:\/\/snncommunity\.github\.io\/\.github\/social-card\.png"/);
 assert.match(html,/twitter:card" content="summary_large_image"/);
});

test('research cards are progressively disclosed without leaving legacy layout code',()=>{
 assert.match(html,/id="resource-more"[^>]+aria-expanded="false" hidden/);
 assert.match(js,/initialResourceLimit=6/);
 assert.match(js,/filtered\.slice\(0,displayLimit\)/);
 assert.doesNotMatch(js,/resource-arrow/);
 assert.doesNotMatch(css,/\.resource-card-bottom/);
 assert.doesNotMatch(css,/\.resource-arrow/);
 assert.match(css,/\.resource-more\[hidden\]/);
});

test('atlas metadata separates university affiliations from software ownership',()=>{
 for(const item of catalog.items){
  assert.ok(Array.isArray(item.topics)&&item.topics.length);
  assert.ok(Array.isArray(item.affiliations));
  if(item.type==='paper'){
    assert.ok(item.publication&&item.publication.venue&&Number.isInteger(item.publication.year));
    assert.ok(item.bibliographySource.startsWith('https://'));
  }else {
    assert.equal(item.publication,null);
    assert.deepEqual(item.affiliations,[]);
  }
  for(const a of item.affiliations){
    assert.ok(a.university&&a.country&&a.source?.startsWith('https://'));
  }
 }
 assert.match(html,/authors’ affiliations at publication/);
});
