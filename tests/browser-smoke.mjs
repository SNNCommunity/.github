import { chromium } from "playwright";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import assert from "node:assert/strict";
const mime={html:"text/html",css:"text/css",js:"text/javascript",json:"application/json",svg:"image/svg+xml",png:"image/png"};
const server=createServer((req,res)=>{
 const u=new URL(req.url,"http://localhost");
 const part=u.pathname.startsWith("/.github/")?u.pathname.slice(9):"";
 const name=part.endsWith("/")||!part?part+"index.html":part;
 const allowed=/^(?:index\.html|styles\.css|portal\.css|paper\.css|sitemap\.xml|app\.js|neuron-core\.js|atlas-core\.js|home-research\.js|research-core\.js|resources\.json|favicon\.svg|social-card\.png|og-card\.svg|404\.html)$/.test(name)||
  /^atlas\/(?:index\.html|corpus\.js|corpus\.css|works\.json|ontology\.json)$/.test(name)||
  /^(?:ecosystem|learn|experiments)\/index\.html$/.test(name)||name==="ecosystem/ecosystem.js"||
  /^papers\/[a-z0-9-]+\/index\.html$/.test(name);
 if(!allowed){res.writeHead(404);res.end("Not found");return;}
 const file=resolve("docs",name);
 if(!existsSync(file)){res.writeHead(404);res.end("Not found");return;}
 res.writeHead(200,{"Content-Type":mime[file.split(".").pop()]||"text/plain"});
 res.end(readFileSync(file));
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port+"/.github/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const out=resolve("artifacts");mkdirSync(out,{recursive:true});
const errors=[];
const captureErrors=page=>page.on("pageerror",error=>errors.push(error.message));
const noOverflow=async(page,label)=>{
 const geometry=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(geometry.scroll<=geometry.client+1,label+" horizontal overflow "+JSON.stringify(geometry));
};
try{
 const home=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
 captureErrors(home);await home.goto(base,{waitUntil:"load"});
 await home.locator(".resource-card").first().waitFor();
 assert.equal(await home.locator("#coverage-total").innerText(),"395");
 assert.equal(await home.locator("#coverage-code").innerText(),"159");
 assert.equal(await home.locator("#coverage-doi").innerText(),"92");
 assert.equal(await home.locator(".atlas-topic").count(),14);
 assert.equal(await home.locator(".resource-card").count(),8);
 assert.ok(await home.locator("#library").evaluate(n=>n.compareDocumentPosition(document.querySelector("#lab"))&Node.DOCUMENT_POSITION_FOLLOWING));
 const publicData=await(await home.request.get(base+"atlas/works.json")).json();
 const taxonomy=await(await home.request.get(base+"atlas/ontology.json")).json();
 assert.equal(publicData.items.length,395);
 assert.equal(publicData.schemaVersion,"atomic-public-395-v1");
 assert.equal(publicData.items.filter(x=>x.codeUrl).length,159);
 assert.equal(taxonomy.groups.length,6);assert.equal(taxonomy.domains.length,13);
 assert.equal(taxonomy.techniques.length,69);
 assert.equal(publicData.items.reduce((n,x)=>n+x.techniques.length,0),280);
 assert.ok(publicData.items.every(w=>!("abstract" in w)&&!("versions" in w)&&!("versionCount" in w)));
 await home.locator("#atlas-code-quick").click();
 assert.match(await home.locator("#resource-count").innerText(),/of 159 papers/);
 await home.locator("#atlas-code-quick").click();
 await home.locator(".atlas-topic[data-topic='D03']").click();
 assert.ok(await home.locator(".resource-card").count()>0);
 assert.match(home.url(),/atlas\.topic=D03/);
 await home.locator("#atlas-reset").click();
 await home.locator("#atlas-technique").selectOption("D02.T06");
 assert.ok(await home.locator(".resource-card").count()>0);
 await home.locator("#atlas-reset").click();
 await home.locator("#atlas-modality").selectOption("Spike camera");
 assert.ok(await home.locator(".resource-card").count()>0);
 await home.locator("#atlas-reset").click();
 await home.locator("#resource-search").fill("Spike-HTR");
 assert.equal(await home.locator(".resource-card").count(),1);
 await home.locator("#resource-search").fill("Hongzhi Wang");
 assert.ok(await home.locator(".resource-card").count()>=1,"secondary author must be indexed");
 assert.ok((await home.locator(".resource-card").allTextContents()).some(x=>x.includes("Spike-HTR")));
 await home.locator("#resource-search").fill("Spike-HTR");
 assert.match(await home.locator(".atlas-record-link").first().getAttribute("href"),/[?&]paper=/);
 await home.locator("#atlas-reset").click();
 await home.locator("#resource-more").click();
 assert.equal(await home.locator(".resource-card").count(),28);
 for(let i=0;i<20&&await home.locator(".resource-card").count()<395;i++)await home.locator("#resource-more").click();
 assert.equal(await home.locator(".resource-card").count(),395);
 await home.locator("#resource-more").click();
 assert.equal(await home.locator(".resource-card").count(),8);
 assert.equal(await home.locator("#spike-count").innerText().then(Number)>0,true);
 assert.ok(Number(await home.locator("#if-count").innerText())>0);
 await home.locator("#compare-if").uncheck();
 assert.equal(await home.locator("#if-count").innerText(),"Off");
 await home.locator("#compare-if").check();
 await home.locator(".preset-button[data-preset='quiet']").click();
 assert.equal(await home.locator("#spike-count").innerText(),"0");
 await home.locator("#reset-lab").click();
 const [csv]=await Promise.all([home.waitForEvent("download"),home.locator("#export-csv").click()]);
 assert.match(csv.suggestedFilename(),/\.csv$/);
 const rows=readFileSync(await csv.path(),"utf8").trim().split("\n");
 assert.equal(rows.length,204);assert.equal(rows[2].split(",").length,8);
 const [png]=await Promise.all([home.waitForEvent("download"),home.locator("#export-png").click()]);
 assert.ok(statSync(await png.path()).size>2000);
 await home.locator("#resource-search").fill("Spike-HTR");
 const link=await home.locator(".atlas-record-link").first().getAttribute("href");
 await home.goto(new URL(link,base).href);
 await home.locator("#detail[open]").waitFor();
 assert.match(await home.locator("#detail").innerText(),/Atomic technical mechanisms|No concept assigned/);
 assert.ok(!(await home.locator("#detail").innerText()).includes("Handwritten Text Recognition (HTR) is computationally imbalanced"));
 await home.locator("#close").click();
 await home.screenshot({path:resolve(out,"atlas-home-desktop.png"),fullPage:true});
 const atlas=await browser.newPage({viewport:{width:1440,height:900}});
 captureErrors(atlas);await atlas.goto(base+"atlas/");
 await atlas.locator(".item").first().waitFor();
 assert.match(await atlas.locator("#count").innerText(),/395 papers/);
 assert.equal(await atlas.locator("#group option").count(),7);
 assert.equal(await atlas.locator("#topic option").count(),14);
 assert.equal(await atlas.locator("#technique option").count(),70);
 assert.equal(await atlas.locator(".group-shortcut").count(),6);
 await atlas.locator("#group").selectOption("G4");
 assert.ok(await atlas.locator(".item").count()>0);
 assert.match(atlas.url(),/group=G4/);
 await atlas.locator("#reset").click();
 await atlas.locator("#technique").selectOption("D02.T06");
 assert.ok(await atlas.locator(".item").count()>0);
 await atlas.locator(".title-button").first().click();
 assert.ok(await atlas.locator("#detail").evaluate(d=>d.open));
 assert.match(await atlas.locator("#detail").innerText(),/Input-to-spike encoding/);
 await atlas.locator("#close").click();
 await atlas.locator("#reset").click();
 await atlas.locator("#model").selectOption("Spiking Transformer");
 assert.ok(await atlas.locator(".item").count()>0);
 await atlas.locator("#reset").click();
 await atlas.locator("#modality").selectOption("Event camera/DVS");
 assert.ok(await atlas.locator(".item").count()>0);
 await atlas.locator("#modality").selectOption("Spike camera");
 assert.ok(await atlas.locator(".item").count()>0);
 await atlas.locator("#reset").click();
 await atlas.locator("#snn").selectOption("sensor_adjacent_snn_unconfirmed");
 assert.ok(await atlas.locator(".item").count()>0);
 await atlas.goto(base+"atlas/?topic=neuron-dynamics");
 await atlas.locator(".item").first().waitFor();
 assert.equal(new URL(atlas.url()).searchParams.get("topic"),"D01");
 await atlas.locator("#reset").click();
 await atlas.locator("#group").selectOption("G4");
 await atlas.locator("#topic").selectOption("D07");
 assert.equal(await atlas.locator("#group").inputValue(),"G3","domain selection must reconcile its group");
 assert.ok(await atlas.locator(".item").count()>0);
 await atlas.locator("#group").selectOption("G4");
 await atlas.locator("#technique").selectOption("D12.T01");
 assert.equal(await atlas.locator("#group").inputValue(),"G6","technique selection must reconcile parent group");
 assert.equal(await atlas.locator("#topic").inputValue(),"D12");
 await atlas.locator("#reset").click();
 await atlas.goto(base+"atlas/?paper=v31-work-001");
 await atlas.locator("#detail[open]").waitFor();
 assert.equal(new URL(atlas.url()).searchParams.get("paper"),"work-8e70ea8ccf3d62c");
 assert.match(await atlas.locator("#detail").innerText(),/Jinxing Han/);
 await atlas.locator("#close").click();
 await atlas.goto(base+"atlas/?record=360");
 await atlas.locator("#detail[open]").waitFor();
 assert.match(await atlas.locator("#detail-title").innerText(),/Spikingformer/);
 assert.equal(new URL(atlas.url()).searchParams.has("record"),false);
 await atlas.locator("#close").click();
 await atlas.screenshot({path:resolve(out,"atlas-research-desktop.png"),fullPage:true});
 for(const width of [1440,768,390,320]){
  for(const [route,name] of [["","home"],["atlas/","atlas"]]){
   const page=await browser.newPage({viewport:{width,height:850}});
   captureErrors(page);await page.goto(base+route,{waitUntil:"load"});
   await page.locator(route?".item":".resource-card").first().waitFor();
   await noOverflow(page,name+" @ "+width);
   if(width===390||width===320)await page.screenshot({path:resolve(out,name+"-"+width+".png"),fullPage:true});
   await page.close();
  }
 }
 for(const area of ["ecosystem","learn","experiments"]){
  const p=await browser.newPage();captureErrors(p);
  await p.goto(base+area+"/");
  assert.equal(await p.locator("main").count(),1,area);
  await p.close();
 }
 const old=await browser.newPage();await old.goto(base+"?atlas.format=resource");
 await old.waitForURL(url=>url.pathname.endsWith("/ecosystem/"));
 await old.close();
 const sitemap=await(await home.request.get(base+"sitemap.xml")).text();
 for(const route of ["atlas","ecosystem","learn","experiments"])
  assert.ok(sitemap.includes("/.github/"+route+"/"));
 assert.deepEqual(errors,[],"Browser JS errors");
 console.log("PASS: 395 single records, 6/13/69 research taxonomy, 159 links, filtering, legacy links, mobile, neuron lab, export and public routes");
}finally{
 await browser.close();await new Promise(done=>server.close(done));
}
