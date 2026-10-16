import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { readFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const catalog=JSON.parse(readFileSync('docs/resources.json','utf8'));
const paperTotal=catalog.items.filter(x=>x.type==='paper').length;
const recordTotal=catalog.items.length;
const mime={html:'text/html',css:'text/css',js:'text/javascript',json:'application/json',svg:'image/svg+xml',png:'image/png'};
const server=createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const path=u.pathname.startsWith('/.github/')?u.pathname.slice(9):'';
 const name=path||'index.html';
 const isAtlas=/^atlas\/(?:|index\.html|corpus\.js|corpus\.css|works\.json)$/.test(name);
 const isPaper=/^papers\/[a-z0-9-]+\/(?:index\.html)?$/.test(name);
 if(!['index.html','styles.css','paper.css','sitemap.xml','app.js','neuron-core.js','atlas-core.js','home-research.js','research-core.js','resources.json','favicon.svg','social-card.png','og-card.svg','404.html'].includes(name)&&!isPaper&&!isAtlas){
  res.writeHead(404);res.end('Not found');return;
 }
 const file=resolve('docs',name.endsWith('/')?name+'index.html':name);
 if(!existsSync(file)){res.writeHead(404);res.end('Not found');return;}
 res.writeHead(200,{'Content-Type':mime[file.split('.').pop()]||'text/plain'});
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
 assert.equal(await page.locator('.resource-card').count(),8,'first eight canonical papers visible');
 assert.ok(await page.locator('#library').evaluate(el=>el.compareDocumentPosition(document.querySelector('#lab'))&Node.DOCUMENT_POSITION_FOLLOWING),'research comes before Lab');
 assert.match(await page.locator('#resource-count').innerText(),/of 395 papers/);
 assert.equal((await page.locator('.atlas-topic[data-topic="all"]').innerText()).includes('395'),true,'All research topic count must be 395');
 assert.equal(await page.locator('.atlas-kind[data-format="paper"][aria-pressed="true"]').count(),1);
 assert.equal(await page.locator('.atlas-record-link').count(),8);
 assert.equal(await page.locator('#atlas-country').count(),0,'obsolete affiliation filter removed');
 assert.equal(await page.locator('#atlas-format').count(),0,'obsolete 19-resource combined format removed');
 await page.locator('#resource-more').click();
 assert.equal(await page.locator('.resource-card').count(),28,'paginated list loads canonical research, not curated cards');
 for(let i=0;i<20&&await page.locator('.resource-card').count()<395;i++)await page.locator('#resource-more').click();
 assert.equal(await page.locator('.resource-card').count(),395,'all canonical research records render on the homepage, not just a count badge');
 assert.equal(await page.locator('.atlas-record-link').count(),395,'every public paper has its stable canonical research record link');
 await page.locator('#resource-more').click();
 assert.equal(await page.locator('.resource-card').count(),8,'Show fewer returns to readable preview without losing papers');
 await page.locator('.atlas-kind[data-format="resource"]').click();
 assert.match(await page.locator('#resource-count').innerText(),/of 9 tools and guides/);
 assert.equal(await page.locator('.resource-card').count(),8);
 assert.equal(await page.locator('.atlas-record-link').count(),0,'tools are not mistaken for papers');
 assert.equal(await page.locator('[data-paper-facet]:visible').count(),0,'paper-only filters hidden in tools tab');
 await page.locator('#resource-more').click();
 assert.equal(await page.locator('.resource-card').count(),9,'all 9 software and guide resources are discoverable');
 await page.locator('.atlas-kind[data-format="paper"]').click();
 assert.equal(await page.locator('.resource-card').count(),8);
 assert.match(await page.locator('#resource-count').innerText(),/395 papers/);
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

 const record=await page.request.get(base+'papers/sew-resnet-2021/');
 assert.equal(record.status(),200,'source-linked paper route works');
 const body=await record.text();
 assert.match(body,/Peng Cheng Laboratory/);
 assert.match(body,/independent reproduction is not documented/);
 assert.match(body,/canonical.*papers\/sew-resnet-2021/);
 assert.match(body,/Wei Fang/);
 assert.match(body,/Research question and method/);
 const siteMap=await page.request.get(base+'sitemap.xml');
 assert.match(await siteMap.text(),/papers\/plif-2021/);
 const publicDataset=await (await page.request.get(base+'atlas/works.json')).json();
 assert.equal(publicDataset.items.length,395,'same data source as dedicated Atlas');
 const group=publicDataset.items.find(x=>x.versionCount===2);
 assert.ok(group,'linked preprint version retained under one work');
 await page.locator('#resource-search').fill('Spike-HTR');
 assert.equal(await page.locator('.resource-card').count(),1,'full-corpus paper title searchable on homepage');
 assert.match(await page.locator('.resource-card .atlas-record-link').first().getAttribute('href'),/[?&]paper=v31-work-/);
 await page.locator('#resource-search').fill('Xiubo Liang');
 assert.ok(await page.locator('.resource-card').count()>1,'first-author search');
 await page.locator('#atlas-reset').click();
 await page.locator('#atlas-year').selectOption('2026');
 assert.match(page.url(),/atlas.year=2026/);
 await page.locator('#atlas-venue').selectOption('ICML');
 assert.ok(await page.locator('.resource-card').count()>0,'year-and-venue filter');
 await page.locator('#atlas-reset').click();
 await page.locator('#atlas-source').selectOption('publisher_specific_page_not_independently_rechecked');
 assert.match(await page.locator('#resource-count').innerText(),/of 140 papers/);
 await page.locator('#atlas-source').selectOption('conference_index_or_aggregate_not_paper_specific');
 assert.match(await page.locator('#resource-count').innerText(),/of 205 papers/);
 await page.locator('#atlas-source').selectOption('not_identified');
 assert.match(await page.locator('#resource-count').innerText(),/of 50 papers/);
 await page.locator('#atlas-reset').click();
 await page.locator('#atlas-code').selectOption('yes');
 assert.ok(await page.locator('.resource-card').count()>0,'code indexing');
 await page.locator('#atlas-reset').click();
 await page.locator('.atlas-topic[data-topic="robotics-embodied"]').click();
 await page.locator('.atlas-topic[data-topic="deep-architectures"]').click();
 assert.equal(await page.locator('.atlas-topic[aria-pressed="true"]').count(),2);
 await page.locator('#atlas-topic-mode').selectOption('all');
 assert.match(page.url(),/atlas.mode=all/);
 await page.locator('#atlas-topic-mode').selectOption('any');
 assert.ok(await page.locator('.resource-card').count()>=2);
 await page.locator('#atlas-reset').click();
 await page.locator('#resource-search').fill('2026 ICML');
 assert.ok(await page.locator('.resource-card').count()>0,'multi-field title/year search');
 await page.locator('#resource-search').fill('not-a-plausible-paper-title');
 assert.equal(await page.locator('.resource-card').count(),0);
 assert.equal(await page.locator('#resource-empty').isVisible(),true);
 await page.locator('#atlas-reset').click();
 assert.equal(await page.locator('.resource-card').count(),8);
 // Real research-page layout, keyboard focus and links (not just GET response).
 for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:900});
   await page.goto(base+'papers/plif-2021/',{waitUntil:'load'});
   const h=await page.locator('h1').textContent();
   assert.match(h,/Learnable Membrane Time Constant/);
   assert.match(await page.locator('.paper-authors').innerText(),/Wei Fang/);
   assert.match(await page.locator('.research-notes').innerText(),/PLIF/);
   assert.equal(await page.locator('.paper-side').count(),0,'duplicate hero evidence removed');
   assert.ok(await page.locator('.paper-jump-nav a').count()>=4,'anchored record navigation');
   assert.ok(await page.locator('.paper-tags a[href*="atlas.topic="]').count()>0);
   const paperSize=await page.evaluate(()=>{
     const get=sel=>Number.parseFloat(getComputedStyle(document.querySelector(sel)).fontSize);
     return {venue:get(".paper-venue"),authors:get(".paper-authors"),
       deck:get(".paper-deck"),topic:get(".paper-tags a"),
       method:get(".research-notes h3 + p"),subtle:get(".research-notes .paper-muted"),
       navigation:get(".paper-jump-nav a"),link:get(".paper-actions .paper-button"),
       footer:get(".paper-footer .container span")};
   });
   for(const [key,min] of Object.entries({
     venue:14,authors:width<=390?15:16,deck:16,topic:14,method:16,
     subtle:15,navigation:14,link:14,footer:15
   }))assert.ok(paperSize[key]>=min,'paper typography '+key+' at '+width+': '+paperSize[key]);
   if(width<=390){
     const methodTop=await page.locator('#research').evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
     assert.ok(methodTop<1800,'scientific content within two mobile viewports: '+methodTop);
     const footer=await page.locator('.paper-footer .container span').evaluateAll(xs=>xs.map(x=>{const r=x.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
     assert.ok(footer[1].top>=footer[0].bottom-1,'footer labels must not collide');
   }
   const over=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(over.scroll<=over.inner+1,'paper horizontal overflow '+width+': '+JSON.stringify(over));
   await page.locator('.paper-actions a').first().focus();
   assert.equal(await page.evaluate(()=>document.activeElement?.tagName),'A');
   if(width===390)await page.screenshot({path:resolve(out,'paper-mobile.png'),fullPage:true});
   if(width===1440)await page.screenshot({path:resolve(out,'paper-desktop.png'),fullPage:true});
 }
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+'?token=private-value&atlas.topic=neuron-dynamics#library');
 await page.locator('.resource-card').first().waitFor();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
 await page.locator('#atlas-copy').click();
 const clean=await page.locator('#atlas-copy-input').inputValue();
 assert.ok(clean.includes('atlas.topic=neuron-dynamics'));
 assert.ok(!clean.includes('token='));
 assert.ok(clean.endsWith('#library'));
 await page.locator('#atlas-reset').click();
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
    "resource metadata":".atlas-card-summary",
    "navigation":".nav-links > a",
    "footer text":".footer-main p",
    "eyebrow":".eyebrow",
    "hero action":".hero-actions .button",
    "topic":".atlas-topic",
    "quick type":".atlas-kind",
    "research tag":".atlas-tag",
    "search input":"#resource-search",
    "facet label":".atlas-field label",
    "facet select":".atlas-field select",
    "metadata source":".resource-evidence summary",
    "method help":".control-explainer",
    "lab legend":".plot-legend",
    "lab stats label":".lab-status small",
    "community note":".community-list small"
  };
  return Object.fromEntries(Object.entries(selectors).map(([name,sel])=>[
    name,Number.parseFloat(getComputedStyle(document.querySelector(sel)).fontSize)]));
 });
 for(const [name,min] of Object.entries({
   "body":16,"resource description":16,"resource heading":20,
   "model note":16,"parameter label":15,"lab action":15,
   "resource metadata":15,"navigation":16,"footer text":15,
   "eyebrow":14,"hero action":15,"topic":14,"quick type":15,
   "research tag":14,"search input":16,"facet label":14,
   "facet select":15,"metadata source":14,"method help":16,
   "lab legend":14,"lab stats label":14,"community note":15
 }))assert.ok(sizes[name]>=min,name+" too small: "+sizes[name]+"px");
 const mobileTexts=await page.locator(".resource-card > p").count();
 assert.equal(mobileTexts,8,'default compact homepage displays eight canonical research cards');
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(out,'desktop.png'),fullPage:true});
 console.log('PASS desktop models, chart, downloads, resource provenance, URL safety and no-JS navigation');

 for(const width of [768,390,320]){
  await page.setViewportSize({width,height:840});
  await page.reload();
  await page.locator('.resource-card').first().waitFor();
  if(width<=390){
    assert.equal(await page.locator('#atlas-advanced').getAttribute('open'),null,'mobile advanced filters initially closed');
    const firstRecordTop=await page.locator('.resource-card').first().evaluate(el=>el.getBoundingClientRect().top+scrollY);
    const fullCorpusTop=await page.locator('.atlas-kind[data-format="paper"]').evaluate(el=>el.getBoundingClientRect().top+scrollY);
    assert.ok(fullCorpusTop<1450,'full 395-work entry must be visible within two standard phone viewports: '+fullCorpusTop);
    assert.ok(firstRecordTop<2300,'full public research appears within comfortable scrolling distance: '+firstRecordTop);
  }
  await page.locator('#atlas-advanced').evaluate(el=>{el.open=true;});
  const fit=await page.evaluate(()=>{
    const sels=[".menu-toggle",".preset-button",".atlas-topic",".atlas-field select",".lab-actions .button"];
    return sels.map(sel=>{
      const r=document.querySelector(sel).getBoundingClientRect();
      return {sel,width:r.width,height:r.height};
    });
  });
  for(const el of fit)assert.ok(el.width>=24&&el.height>=44,
    "target too small at "+width+": "+JSON.stringify(el));
  const mobileType=await page.evaluate(()=>{
    const get=sel=>Number.parseFloat(getComputedStyle(document.querySelector(sel)).fontSize);
    return {description:get('.atlas-card > p'),title:get('.atlas-card h3'),
      topic:get('.atlas-topic'),tag:get('.atlas-tag'),tab:get('.atlas-kind'),
      select:get('.atlas-field select'),action:get('.atlas-card-actions a'),
      model:get('.model-note'),lab:get('.lab-status small'),nav:get('.nav-links > a')};
  });
  for(const [name,min] of Object.entries({
    description:16,title:20,topic:14,tag:14,tab:14,
    select:width<=380?14:15,action:14,model:16,lab:14,nav:16
  }))assert.ok(mobileType[name]>=min,'mobile typography '+name+' '+width+': '+mobileType[name]);
  const over=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(over.scroll<=over.inner+1,'horizontal overflow at '+width+': '+JSON.stringify(over));
  if(width===390){
   await page.locator('#atlas-advanced').evaluate(el=>{el.open=false;});
   await page.locator('#menu-toggle').click();
   assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
   await page.locator('#site-menu a[href="#library"]').click();
   assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
   await page.screenshot({path:resolve(out,'mobile.png'),fullPage:true});
  }
  if(width===768)await page.screenshot({path:resolve(out,'tablet.png'),fullPage:true});
  if(width===390){
    await page.evaluate(()=>{document.documentElement.style.fontSize='20px';});
    const enlarged=await page.evaluate(()=>({
      body:Number.parseFloat(getComputedStyle(document.body).fontSize),
      scroll:document.documentElement.scrollWidth,inner:innerWidth
    }));
    assert.ok(enlarged.body>=20,'browser font size should scale rem text');
    assert.ok(enlarged.scroll<=enlarged.inner+1,'125% root font overflows: '+JSON.stringify(enlarged));
    await page.evaluate(()=>{document.documentElement.style.fontSize='';});
  }
 }

 // Final V13: one public card per unique work, no original abstracts or private upload controls.
 const corpusPage=await browser.newPage({viewport:{width:1440,height:900}});
 corpusPage.on('pageerror',e=>errors.push('V13 '+e.message));
 await corpusPage.goto(base+'atlas/',{waitUntil:'load'});
 await corpusPage.locator('.item').first().waitFor();
 assert.match(await corpusPage.locator('#count').innerText(),/395 papers/);
 assert.equal(await corpusPage.locator('.item').count(),24);
 assert.equal(await corpusPage.locator('.metrics strong').first().innerText(),'395');
 assert.equal(await corpusPage.locator('#private-file').count(),0,'public page must not accept private abstracts');
 assert.equal(await corpusPage.locator('#unit').count(),0,'no obsolete version/work toggle');
 assert.equal(await corpusPage.locator('#abstract').count(),0,'no public abstract browser');
 assert.match(await corpusPage.locator('.item').first().innerText(),/authors|Xiubo Liang/i);
 await corpusPage.locator('#q').fill('Spike-HTR');
 assert.equal(await corpusPage.locator('.item').count(),1,'search by title');
 await corpusPage.locator('#q').fill('Xiubo Liang');
 assert.ok(await corpusPage.locator('.item').count()>1,'search by first author');
 await corpusPage.locator('#reset').click();
 for(const [source,expected] of [
   ['publisher_specific_page_not_independently_rechecked',140],
   ['conference_index_or_aggregate_not_paper_specific',205],
   ['not_identified',50]]){
   await corpusPage.locator('#source').selectOption(source);
   assert.match(await corpusPage.locator('#count').innerText(),new RegExp(expected+' papers'));
 }
 await corpusPage.locator('#reset').click();
 await corpusPage.locator('#code').selectOption('yes');
 assert.ok(await corpusPage.locator('.item').count()>0,'code filter');
 await corpusPage.locator('#reset').click();
 await corpusPage.locator('#topic').selectOption('robotics-embodied');
 assert.ok(await corpusPage.locator('.item').count()>0,'topic filter');
 assert.match(corpusPage.url(),/topic=robotics-embodied/);
 await corpusPage.locator('#reset').click();
 const publicData=await (await corpusPage.request.get(base+'atlas/works.json')).json();
 assert.equal(publicData.items.length,395);
 const merged=publicData.items.filter(x=>x.versionCount>1);
 assert.equal(merged.length,1,'only one merged work');
 assert.equal(merged[0].versions.length,2);
 await corpusPage.goto(base+'atlas/?record=360');
 await corpusPage.locator('dialog[open]').waitFor();
 assert.match(await corpusPage.locator('#detail-body').innerText(),/Spikingformer/);
 assert.ok(!new URL(corpusPage.url()).searchParams.has('record'),'old ordinal deep link migrated');
 assert.equal(new URL(corpusPage.url()).searchParams.get('paper'),merged[0].id);
 await corpusPage.locator('#close').click();
 await corpusPage.goto(base+'atlas/?paper='+encodeURIComponent(merged[0].id));
 await corpusPage.locator('dialog[open]').waitFor();
 assert.match(await corpusPage.locator('#detail-body').innerText(),/Publication history/);
 assert.match(await corpusPage.locator('#detail-body').innerText(),/Spikingformer: Spike-driven Residual Learning/);
 assert.doesNotMatch(await corpusPage.locator('#detail-body').innerText(),/Author-original abstract|Abstract text/);
 await corpusPage.locator('#close').click();
 assert.ok(!(new URL(corpusPage.url())).searchParams.has('paper'));
 // Stable history: closing a card leaves the current search criteria intact.
 await corpusPage.locator('#q').fill('Spike-HTR');
 await corpusPage.locator('.item .actions button').first().click();
 assert.match(corpusPage.url(),/paper=v31-work-/);
 await corpusPage.locator('#close').click();
 assert.match(await corpusPage.locator('#q').inputValue(),/Spike-HTR/);
 await corpusPage.locator('#reset').click();
 for(const width of [1440,768,390,320]){
   await corpusPage.setViewportSize({width,height:850});
   await corpusPage.goto(base+'atlas/',{waitUntil:'load'});
   await corpusPage.locator('.item').first().waitFor();
   const fit=await corpusPage.evaluate(()=>({
     client:document.documentElement.clientWidth,
     scroll:document.documentElement.scrollWidth,
     title:getComputedStyle(document.querySelector('.item h3')).fontSize,
     search:getComputedStyle(document.querySelector('#q')).fontSize
   }));
   assert.ok(fit.scroll<=fit.client+1,'V13 horizontal overflow at '+width+': '+JSON.stringify(fit));
   assert.ok(parseFloat(fit.title)>=19,'V13 title too small at '+width);
   assert.ok(parseFloat(fit.search)>=14,'V13 search field too small at '+width);
   if(width===1440)await corpusPage.screenshot({path:resolve(out,'corpus-desktop.png'),fullPage:true});
   if(width===390)await corpusPage.screenshot({path:resolve(out,'corpus-mobile.png'),fullPage:true});
 }
 // V15: carry exact multi-topic filters across the two public research pages.
 await page.goto(base+'?atlas.topic=deep-architectures,sequence-language&atlas.mode=all#library');
 await page.locator('.resource-card').first().waitFor();
 const homeCount=Number((await page.locator('#resource-count').innerText()).match(/of (\d+) papers/)[1]);
 assert.ok(homeCount>0,'combined multi-topic criteria must match at least one work');
 const fullLink=await page.locator('[data-full-atlas-link]').first().getAttribute('href');
 assert.match(fullLink,/topics=deep-architectures%2Csequence-language/);
 assert.match(fullLink,/mode=all/);
 await corpusPage.goto(new URL(fullLink,page.url()).href,{waitUntil:'load'});
 await corpusPage.locator('#count').waitFor();
 assert.equal(Number((await corpusPage.locator('#count').innerText()).match(/^(\d+)/)[1]),homeCount,
   'homepage and dedicated Atlas share scientific search semantics');
 assert.match(await corpusPage.locator('#multi-topic-note').innerText(),/match every topic/);
 await corpusPage.locator('#chips button').filter({hasText:'Topic:'}).first().click();
 assert.ok(!new URL(corpusPage.url()).searchParams.has('mode'),'single remaining topic no longer retains old multi-topic mode');
 // Sanitized shareable /atlas/ link must never include unrelated sensitive URL parameters.
 await corpusPage.goto(base+'atlas/?token=should-not-leak&q=Spike-HTR#results');
 await corpusPage.locator('.item').first().waitFor();
 await corpusPage.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
 await corpusPage.locator('#share').click();
 const shared=await corpusPage.locator('#share-input').inputValue();
 assert.ok(shared.includes('q=Spike-HTR'));
 assert.ok(!shared.includes('token='),'dedicated Atlas share strips non-research URL params');
 await corpusPage.close();
 assert.deepEqual(errors,[]);
 console.log('PASS 768/390/320 widths, mobile nav, and browser errors');
} finally {await browser.close();await new Promise(ok=>server.close(ok));}
