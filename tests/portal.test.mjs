import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root=new URL('../',import.meta.url).pathname;
const file=name=>readFileSync(join(root,name),'utf8');
const html=file('docs/index.html');
const css=file('docs/styles.css');
const js=file('docs/app.js');

test('static Pages files are present',()=>{
 for(const name of ['docs/index.html','docs/styles.css','docs/app.js','docs/favicon.svg','docs/404.html','docs/.nojekyll'])
   assert.ok(existsSync(join(root,name)),name+' missing');
});
test('site has a unique title, accessible navigation and a skip link',()=>{
 assert.match(html,/<title>SNN Community/);
 assert.match(html,/<a class="skip-link" href="#main">/);
 assert.match(html,/aria-controls="site-menu"/);
 assert.match(html,/<main id="main">/);
 assert.match(html,/lang="en"/);
});
test('all local referenced assets exist in the publishing directory',()=>{
 for(const name of ['styles.css','app.js','favicon.svg']) assert.ok(existsSync(join(root,'docs',name)));
 for(const id of ['lif-canvas','tau','threshold','current','resource-grid','resource-search','menu-toggle','site-menu'])
   assert.ok(html.includes('id="'+id+'"'),id+' missing');
});
test('scientific disclaimer and provenance are explicit',()=>{
 assert.match(html,/forward Euler/i);
 assert.match(html,/not benchmark evidence/i);
 assert.match(html,/founding stage/i);
 assert.match(html,/no affiliation or endorsement/i);
});
test('resources stay discoverable and local LIF implementation is present',()=>{
 for(const name of ['NeuroBench','snnTorch','SpikingJelly','Tonic','Norse'])
   assert.ok(js.includes(name),name+' not present in source');
 assert.match(js,/function simulate\(\)/);
 assert.match(js,/v\+=\(dt\/state\.tau\)\*\(-v\+i\)/);
 assert.match(js,/navigator\.clipboard/);
 assert.match(js,/textContent/);
});
test('mobile and accessibility styling are included',()=>{
 assert.match(css,/@media \(max-width: 560px\)/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css, /\.nav-links\.is-open/);
});

test('canonical release has no legacy banner, old design or setup files',()=>{
 for(const name of ['DESIGN.md','SETUP.md','assets/hero-dark.svg','assets/hero-light.svg','assets/logo-mark.svg']) {
   assert.ok(!existsSync(join(root,name)),name+' is an obsolete prior-version artifact');
 }
 const profile=file('profile/README.md');
 const readme=file('README.md');
 const portal=file('PORTAL.md');
 const roadmap=file('ROADMAP.md');
 for(const content of [profile,readme,portal,roadmap]) {
   assert.doesNotMatch(content,/legacy\s*(?:V[23]|draft)|[Pp]ages activation pending|deployment pending/);
 }
 assert.ok(profile.includes('https://snncommunity.github.io/.github/'));
 assert.ok(readme.includes('docs/favicon.svg'));
 assert.ok(html.includes('rel="canonical" href="https://snncommunity.github.io/.github/"'));
 assert.ok(!html.includes('/assets/hero-light.svg'));
});
test('simulator uses exact 200 updates from initial state and hard-reset event times',()=>{
 assert.match(js,/traces=\[v\]/);
 assert.match(js,/for\(let t=0;t<simMs;t\+=dt\)/);
 assert.match(js,/spikeTimes\.push\(t\+dt\)/);
 assert.match(js,/new Set\(latestSim\.spikeTimes\)/);
 assert.match(js,/ctx\.lineTo\(x,sy\(state\.threshold\)\)/);
});
test('404 navigation uses canonical homepage independent of missing URL depth',()=>{
 const notFound=file('docs/404.html');
 assert.ok(notFound.includes('href="https://snncommunity.github.io/.github/"'));
 assert.ok(notFound.includes('min-height:100svh'));
});

test('GitHub organization profile prioritizes the official website as a one-click entry',()=>{
 const profile=file('profile/README.md');
 assert.match(profile,/Explore SNN Community/);
 assert.match(profile,/href="https:\/\/snncommunity\.github\.io\/\.github\/"/);
 assert.doesNotMatch(profile,/<meta\s+http-equiv|<script/i);
 assert.doesNotMatch(profile,/cannot be configured to issue an automatic external-site/i);
});
test('reproducible lab includes functional download and sharing controls',()=>{
 for(const id of ['copy-config','export-csv','export-png','share-lab','lab-feedback','share-url','share-fallback'])
   assert.ok(html.includes('id="'+id+'"'),id+' missing');
 assert.match(html,/role="status" aria-live="polite"/);
 assert.match(js,/function shareURL\(\)/);
 assert.match(js,/function download\(blob,filename\)/);
 assert.match(js,/URL\.revokeObjectURL/);
 assert.match(js,/membrane_after_reset,spike,input_previous_interval/);
 assert.match(js,/canvas\.toBlob/);
 assert.match(js,/new URLSearchParams\(window\.location\.search\)/);
 assert.match(js,/Number\.isFinite\(numeric\)/);
 assert.match(js,/function syncInputs\(\)/);
 assert.match(html,/data-preset="quiet"/);
 assert.match(html,/data-preset="regular"/);
 assert.match(html,/data-preset="burst"/);
});

test('share URLs are parameter allowlists and imports never overwrite a changed experiment after refresh',()=>{
 assert.match(js,/const url=new URL\("https:\/\/snncommunity\.github\.io\/\.github\/"\)/);
 assert.match(js,/function clearImportedParameters\(\)/);
 assert.match(js,/window\.history\.replaceState/);
 assert.match(js,/clearImportedParameters\(\);syncInputs\(\)/);
});
test('scientific methods and no-JavaScript resources remain discoverable',()=>{
 assert.match(html,/Model specification/);
 assert.match(html,/<noscript>/);
 assert.match(html,/The searchable directory requires JavaScript/);
 assert.match(html,/https:\/\/github\.com\/NeuroBench\/neurobench/);
 assert.match(css,/\.noscript-resources/);
});
