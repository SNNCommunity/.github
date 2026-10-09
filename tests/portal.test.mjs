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
