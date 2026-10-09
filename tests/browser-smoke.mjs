import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const output=resolve('artifacts');
mkdirSync(output,{recursive:true});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
const url=pathToFileURL(resolve('docs/index.html')).href;
try {
  await page.goto(url,{waitUntil:'load'});
  await page.locator('#resource-grid .resource-card').first().waitFor();
  assert.equal(await page.locator('#resource-grid .resource-card').count(),12,'all curated resources rendered');
  assert.match(await page.locator('#spike-count').innerText(),/^\d+$/);
  const initialCount=Number(await page.locator('#spike-count').innerText());
  assert.ok(initialCount>0,'default neuron should emit spikes');
  await page.locator('#current').evaluate(el=>{el.value='0.50';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const weakerCount=Number(await page.locator('#spike-count').innerText());
  assert.equal(weakerCount,0,'subthreshold step stimulus should emit no spikes');
  await page.locator('#reset-lab').click();
  assert.equal(Number(await page.locator('#spike-count').innerText()),initialCount,'reset restores baseline spike count');
  await page.locator('#threshold').evaluate(el=>{el.value='1.25';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.ok(Number(await page.locator('#spike-count').innerText())<=initialCount,'higher threshold cannot increase spikes for this constant stimulus');
  await page.locator('#reset-lab').click();
  await page.locator('input[name="input-mode"][value="pulses"]').check({force:true});
  assert.equal(await page.locator('input[name="input-mode"][value="pulses"]').isChecked(),true,'pulse stimulus selectable');
  assert.match(await page.locator('#spike-count').innerText(),/^\d+$/,'pulse experiment returns spike count');
  await page.locator('#reset-lab').click();

  await page.locator('.filter-chip[data-filter="events"]').click();
  assert.equal(await page.locator('#resource-grid .resource-card').count(),3,'events category filter');
  await page.locator('#resource-search').fill('no-such-resource-1234');
  assert.equal(await page.locator('#resource-grid .resource-card').count(),0,'no matching resources');
  assert.equal(await page.locator('#resource-empty').isVisible(),true,'accessible empty state visible');
  await page.locator('#resource-search').fill('');
  await page.locator('.filter-chip[data-filter="all"]').click();
  assert.equal(await page.locator('#resource-grid .resource-card').count(),12,'all resources restored');
  // Parameterized URLs must restore only in-range, valid normalized settings.
  await page.goto(url+'?tau=15&threshold=1.00&current=1.65&mode=pulses#lab');
  await page.locator('#resource-grid .resource-card').first().waitFor();
  assert.equal(await page.locator('#tau').inputValue(),'15','valid tau restored');
  assert.equal(await page.locator('#threshold').inputValue(),'1','valid threshold restored');
  assert.equal(await page.locator('#current').inputValue(),'1.65','valid amplitude restored');
  assert.ok(await page.locator('input[name="input-mode"][value="pulses"]').isChecked(),'pulse mode restored');
  assert.equal(await page.locator('#spike-count').isVisible(),true,'simulation still runs after shared URL');

  // Exports must be useful files, not inert buttons.
  const [csvFile] = await Promise.all([page.waitForEvent('download'),page.locator('#export-csv').click()]);
  const csv=readFileSync(await csvFile.path(),'utf8');
  const csvLines=csv.trimEnd().split('\n');
  assert.equal(csvLines.length,204,'metadata/header and 201 state rows');
  assert.match(csvLines[2],/^time_ms,membrane_after_reset,spike,input_previous_interval$/);
  assert.ok(csvLines[3].startsWith('0,0.00000000,0,'),'initial observation at t=0');
  assert.ok(csvLines.at(-1).startsWith('200,'),'last observation at t=200');
  assert.ok(csvLines.slice(4).some(line=>line.split(',')[2]==='1'),'binary spike event samples included');

  const [pngFile] = await Promise.all([page.waitForEvent('download'),page.locator('#export-png').click()]);
  assert.match(pngFile.suggestedFilename(),/\.png$/);
  assert.ok(statSync(await pngFile.path()).size>1000,'valid PNG image saved');

  await page.locator('.preset-button[data-preset="quiet"]').click();
  assert.equal(await page.locator('#spike-count').innerText(),'0','quiet neuron example emits no spikes');
  await page.locator('.preset-button[data-preset="regular"]').click();
  assert.ok(Number(await page.locator('#spike-count').innerText())>0,'regular example fires');
  await page.locator('.preset-button[data-preset="burst"]').click();
  assert.ok(await page.locator('input[name="input-mode"][value="pulses"]').isChecked(),'pulsed preset changes input mode');

  // Simulate an explicitly denied clipboard to verify the manual-share fallback.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
  await page.locator('#share-lab').click();
  assert.equal(await page.locator('#share-fallback').isVisible(),true,'share fallback appears');
  const share=await page.locator('#share-url').inputValue();
  assert.ok(share.startsWith('https://snncommunity.github.io/.github/'),'share uses public canonical website');
  assert.match(share,/tau=12/);
  assert.match(share,/mode=pulses/);
  assert.ok(share.endsWith('#lab'),'link navigates directly to lab');
  await page.locator('#reset-lab').click();
  assert.equal(await page.locator('#share-fallback').isVisible(),false,'reset clears fallback');

  await page.goto(url+'?tau=999&threshold=NaN&current=-5&mode=unknown#lab');
  await page.locator('#resource-grid .resource-card').first().waitFor();
  assert.equal(await page.locator('#tau').inputValue(),'20','invalid tau ignored');
  assert.equal(await page.locator('#threshold').inputValue(),'0.85','invalid threshold ignored');
  assert.equal(await page.locator('#current').inputValue(),'1.55','invalid amplitude ignored');

  await page.screenshot({path:resolve(output,'desktop.png'),fullPage:true});
  console.log('PASS desktop: navigation, LIF simulation, reset and resource filtering');
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await page.locator('#resource-grid .resource-card').first().waitFor();
  assert.equal(await page.locator('.menu-toggle').isVisible(),true,'mobile toggle visible');
  await page.locator('#menu-toggle').click();
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true','menu expands');
  await page.locator('#site-menu a[href="#library"]').click();
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false','menu closes on navigation');
  const overflow=await page.evaluate(()=>({viewport:window.innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(overflow.scroll<=overflow.viewport+1,'no mobile horizontal overflow: '+JSON.stringify(overflow));
  await page.setViewportSize({width:320,height:700});
  const narrow=await page.evaluate(()=>({viewport:window.innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(narrow.scroll<=narrow.viewport+1,'no 320px horizontal overflow: '+JSON.stringify(narrow));
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:resolve(output,'mobile.png'),fullPage:true});
  assert.deepEqual(errors,[],'no uncaught browser errors');
  console.log('PASS mobile: menu, in-page navigation, overflow and browser errors');
} finally {await browser.close();}
