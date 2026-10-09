import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { readFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const mime={html:'text/html',css:'text/css',js:'text/javascript',json:'application/json',svg:'image/svg+xml',png:'image/png'};
const server=createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const path=u.pathname.startsWith('/.github/')?u.pathname.slice(9):'';
 const name=path||'index.html';
 if(!['index.html','styles.css','app.js','neuron-core.js','resources.json','favicon.svg','social-card.png','og-card.svg','404.html'].includes(name)){
  res.writeHead(404);res.end('Not found');return;
 }
 const file=resolve('docs',name);
 if(!existsSync(file)){res.writeHead(404);res.end('Not found');return;}
 res.writeHead(200,{'Content-Type':mime[name.split('.').pop()]||'text/plain'});
 res.end(readFileSync(file));
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port+'/.github/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[],out=resolve('artifacts');mkdirSync(out,{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,acceptDownloads:true});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'load'});
 await page.locator('.resource-card').first().waitFor();
 assert.equal(await page.locator('.resource-card').count(),12);
 assert.ok(Number(await page.locator('#spike-count').innerText())>0,'default LIF fires');
 assert.ok(Number(await page.locator('#if-count').innerText())>0,'matched IF fires');
 assert.match(await page.locator('#experiment-summary').innerText(),/IF without leak/);
 await page.locator('#compare-if').uncheck();
 assert.equal(await page.locator('#if-count').innerText(),'Off');
 await page.locator('#compare-if').check();
 assert.match(await page.locator('#if-count').innerText(),/^\d+$/);
 await page.locator('.preset-button[data-preset="quiet"]').click();
 assert.equal(await page.locator('#spike-count').innerText(),'0');
 await page.locator('.preset-button[data-preset="regular"]').click();
 const baseCount=Number(await page.locator('#spike-count').innerText());
 await page.locator('#current').evaluate(el=>{el.value='0.50';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(Number(await page.locator('#spike-count').innerText()),0,'low input is subthreshold');
 await page.locator('#reset-lab').click();
 assert.equal(Number(await page.locator('#spike-count').innerText()),baseCount);
 await page.locator('input[name="input-mode"][value="pulses"]').check({force:true});
 assert.ok(await page.locator('input[name="input-mode"][value="pulses"]').isChecked());
 await page.locator('#reset-lab').click();

 const [csvDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#export-csv').click()]);
 assert.match(csvDownload.suggestedFilename(),/\.csv$/);
 const csv=readFileSync(await csvDownload.path(),'utf8').trim().split('\n');
 assert.equal(csv.length,204,'metadata + header + 201 observations');
 assert.equal(csv[2].split(',').length,8);
 assert.ok(csv[3].startsWith('0,,0.00000000,0.00000000,0,'));
 assert.ok(csv.at(-1).startsWith('200,'));
 assert.ok(csv.slice(4).some(row=>row.split(',')[4]==='1'),'LIF spike markers exist');
 assert.ok(csv.slice(4).some(row=>row.split(',')[7]==='1'),'IF spike markers exist');
 const [png]=await Promise.all([page.waitForEvent('download'),page.locator('#export-png').click()]);
 assert.ok(statSync(await png.path()).size>2000);
 assert.match(png.suggestedFilename(),/\.png$/);
 const og=await page.request.get(base+'social-card.png');
 assert.equal(og.status(),200);
 assert.equal(og.headers()['content-type'],'image/png');
 assert.ok((await og.body()).length>5000);

 await page.locator('.filter-chip[data-filter="events"]').click();
 assert.equal(await page.locator('.resource-card').count(),3);
 await page.locator('#resource-search').fill('Gallego');
 assert.equal(await page.locator('.resource-card').count(),1);
 assert.match(await page.locator('.resource-card').innerText(),/10.1109|DOI/);
 await page.locator('#resource-search').fill('impossible missing');
 assert.equal(await page.locator('.resource-card').count(),0);
 assert.equal(await page.locator('#resource-empty').isVisible(),true);
 await page.locator('#resource-search').fill('');
 await page.locator('.filter-chip[data-filter="all"]').click();
 assert.equal(await page.locator('.resource-card').count(),12);

 await page.goto(base+'?tau=12&threshold=0.75&current=1.60&mode=pulses&compare=0&token=keep-private#lab');
 assert.equal(await page.locator('#tau').inputValue(),'12');
 assert.equal(await page.locator('#if-count').innerText(),'Off');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
 await page.locator('#share-lab').click();
 const link=await page.locator('#share-url').inputValue();
 assert.match(link,/compare=0/);
 assert.ok(!link.includes('token='));
 assert.ok(link.endsWith('#lab'));
 await page.locator('#reset-lab').click();
 assert.ok(!new URL(page.url()).searchParams.has('compare'));
 await page.reload();
 assert.equal(await page.locator('#tau').inputValue(),'20');

 const njs=await browser.newPage({javaScriptEnabled:false});
 await njs.goto(base);
 assert.ok(await njs.locator('.noscript-resources').isVisible());
 assert.ok(await njs.locator('.noscript-resources a').count()>=4);
 await njs.close();
 // Visual typography regression, measured from actual Chromium computed styles.
 const sizes=await page.evaluate(()=>{
  const selectors={
    "body":"body",
    "resource description":".resource-card p",
    "resource heading":".resource-card h3",
    "model note":".model-note",
    "parameter label":".control-field label",
    "lab action":".lab-actions .button",
    "resource metadata":".resource-metadata",
    "navigation":".nav-links > a",
    "footer text":".footer-main p"
  };
  return Object.fromEntries(Object.entries(selectors).map(([name,sel])=>[
    name,Number.parseFloat(getComputedStyle(document.querySelector(sel)).fontSize)]));
 });
 for(const [name,min] of Object.entries({
   "body":16,"resource description":15,"resource heading":21,
   "model note":13,"parameter label":14,"lab action":14,
   "resource metadata":13,"navigation":14,"footer text":15
 }))assert.ok(sizes[name]>=min,name+" too small: "+sizes[name]+"px");
 const mobileTexts=await page.locator(".resource-card p").count();
 assert.equal(mobileTexts,12);
 await page.screenshot({path:resolve(out,'desktop.png'),fullPage:true});
 console.log('PASS desktop models, chart, downloads, resource provenance, URL safety and no-JS navigation');

 for(const width of [768,390,320]){
  await page.setViewportSize({width,height:840});
  await page.reload();
  await page.locator('.resource-card').first().waitFor();
  const fit=await page.evaluate(()=>{
    const sels=[".menu-toggle",".preset-button",".filter-chip",".lab-actions .button"];
    return sels.map(sel=>{
      const r=document.querySelector(sel).getBoundingClientRect();
      return {sel,width:r.width,height:r.height};
    });
  });
  for(const el of fit)assert.ok(el.width>=24&&el.height>=44,
    "target too small at "+width+": "+JSON.stringify(el));
  const mobileBody=await page.locator(".resource-card p").first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  assert.ok(mobileBody>=15,"resource descriptions too small at "+width+": "+mobileBody);
  const over=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(over.scroll<=over.inner+1,'horizontal overflow at '+width+': '+JSON.stringify(over));
  if(width===390){
   await page.locator('#menu-toggle').click();
   assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
   await page.locator('#site-menu a[href="#library"]').click();
   assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
   await page.screenshot({path:resolve(out,'mobile.png'),fullPage:true});
  }
  if(width===768)await page.screenshot({path:resolve(out,'tablet.png'),fullPage:true});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS 768/390/320 widths, mobile nav, and browser errors');
} finally {await browser.close();await new Promise(ok=>server.close(ok));}
