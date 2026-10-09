import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('docs/index.html'),js=read('docs/app.js'),css=read('docs/styles.css'),
  catalog=JSON.parse(read('docs/resources.json')),profile=read('profile/README.md');
test('production files, metadata and required controls are present',()=>{
 for(const p of ['docs/index.html','docs/app.js','docs/neuron-core.js','docs/resources.json',
  'docs/styles.css','docs/favicon.svg','docs/404.html','docs/og-card.svg','docs/.nojekyll'])
  assert.ok(existsSync(new URL('../'+p,import.meta.url)),p);
 for(const id of ['lif-canvas','compare-if','if-count','spike-count','lif-rate','if-rate',
  'experiment-summary','export-csv','export-png','share-lab','resource-grid','resource-search'])
  assert.ok(html.includes('id="'+id+'"'),id+' missing');
 assert.match(html,/rel="canonical"/);
 assert.match(html,/application\/ld\+json/);
 assert.match(html,/twitter:card/);
 assert.match(html,/aria-describedby="experiment-summary model-summary"/);
});
test('open source provenance entries use unique structured records',()=>{
 assert.equal(catalog.schemaVersion,1);
 assert.equal(catalog.items.length,12);
 assert.equal(new Set(catalog.items.map(x=>x.id)).size,12);
 for(const x of catalog.items){
  assert.match(x.url,/^https:\/\//);
  assert.equal(x.verification,'indexed_not_reproduced');
  assert.equal(typeof x.description,'string');
  assert.ok('license' in x&&'licenseUrl' in x&&'doi' in x&&'code' in x);
 }
 const doi=catalog.items.filter(x=>x.type==='paper').map(x=>x.doi);
 assert.deepEqual(doi,['10.1109/JPROC.2023.3308088','10.1109/MSP.2019.2931595','10.1109/TPAMI.2020.3008413']);
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
