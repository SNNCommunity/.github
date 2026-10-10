import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require=createRequire(import.meta.url),atlas=require('../docs/atlas-core.js');
const data=JSON.parse(readFileSync(new URL('../docs/resources.json',import.meta.url),'utf8'));
const items=atlas.validate(data).items;
const find=(id)=>items.find(x=>x.id===id);
test('catalog is schema-valid and classification covers real research dimensions',()=>{
 assert.equal(data.schemaVersion,2);
 assert.ok(items.length>=22);
 assert.equal(new Set(items.map(x=>x.id)).size,items.length);
 assert.equal(data.topics.length,11);
 assert.ok(data.topics.every(t=>items.some(x=>x.topics.includes(t.id))));
 assert.ok(items.filter(x=>x.publication).length>=13);
});
test('research topic tags are multi-label and apply to papers and tools',()=>{
 assert.ok(atlas.filter(items,{topic:'neuron-dynamics'}).some(x=>x.id==='plif-2021'));
 assert.ok(atlas.filter(items,{topic:'deep-architectures'}).some(x=>x.id==='sew-resnet-2021'));
 assert.ok(atlas.filter(items,{topic:'robotics-embodied'}).some(x=>x.id==='spike-vla-2026'));
 assert.ok(atlas.filter(items,{topic:'benchmarks-tools'}).some(x=>x.id==='norse'));
});
test('year, publication type and specific venue intersect correctly',()=>{
 let results=atlas.filter(items,{format:'paper',year:'2026',venueType:'Conference',venue:'ICML'});
 assert.deepEqual(results.map(x=>x.id),['spike-htr-2026','spike-vla-2026'].sort((a,b)=>
   find(a).title.localeCompare(find(b).title,'en')));
 results=atlas.filter(items,{format:'paper',venueType:'Journal',year:'2022'});
 assert.deepEqual(results.map(x=>x.id),['gallego-2022']);
 assert.ok(atlas.filter(items,{format:'resource',year:'2026'}).length===0);
});
test('country and university reflect author-affiliation combinations, not nationality',()=>{
 const fr=atlas.filter(items,{country:'France'});
 assert.ok(fr.some(x=>x.id==='sew-resnet-2021')&&fr.some(x=>x.id==='plif-2021'));
 const uk=atlas.filter(items,{country:'United Kingdom',university:'University of Oxford'});
 assert.deepEqual(uk.map(x=>x.id),['spikellm-2025']);
 const usa=atlas.filter(items,{country:'United States',university:'University of Pennsylvania',year:'2025'});
 assert.deepEqual(usa.map(x=>x.id),['spikachu-2025']);
 const de=atlas.filter(items,{country:'Germany',university:'Technische Universität Berlin'});
 assert.deepEqual(de.map(x=>x.id),['gallego-2022']);
 assert.equal(atlas.filter(items,{country:'France',university:'University of Oxford'}).length,0);
 assert.equal(atlas.filter(items,{format:'resource',country:'China'}).length,0);
});
test('unknown affiliations remain explicitly unverified, and sorting is stable',()=>{
 const unknown=atlas.filter(items,{country:'unknown',format:'paper'});
 assert.ok(unknown.includes(find('spike-htr-2026')));
 assert.ok(!unknown.includes(find('sew-resnet-2021')));
 assert.ok(atlas.filter(items,{format:'paper',sort:'recent'})[0].publication.year>=2025);
 const ascending=atlas.filter(items,{format:'paper',sort:'oldest'});
 assert.ok(ascending[0].publication.year<=ascending.at(-1).publication.year);
 const title=atlas.filter(items,{format:'paper',sort:'title'}).map(x=>x.title);
 assert.deepEqual(title,[...title].sort((a,b)=>a.localeCompare(b,'en')));
});
test('search includes country university and authors publishers without guessing',()=>{
 assert.ok(atlas.filter(items,{query:'Oxford'}).some(x=>x.id==='spikellm-2025'));
 assert.ok(atlas.filter(items,{query:'spikevla',format:'paper'}).some(x=>x.id==='spike-vla-2026'));
 assert.deepEqual(atlas.filter(items,{query:'unlikely phrase never exists'}),[]);
});
test('facets enumerate publication years, venues and real cited universities',()=>{
 const f=atlas.facets(items);
 assert.ok(f.years.includes(2026)&&f.years.includes(2019));
 assert.ok(f.venues.includes('ICML')&&f.venues.includes('IEEE TPAMI'));
 assert.ok(f.countries.includes('Germany')&&f.countries.includes('China'));
 assert.ok(f.universities('United Kingdom').includes('University of Oxford'));
 assert.ok(!f.universities('France').includes('University of Oxford'));
});
test('validator rejects unsupported scientific claims and missing citations',()=>{
 const clone=structuredClone(data);clone.items[0].verification='reproduced';
 assert.throws(()=>atlas.validate(clone),/Invalid atlas entry/);
 const clone2=structuredClone(data);clone2.items.find(x=>x.id==='sew-resnet-2021').affiliations[0].source='';
 assert.throws(()=>atlas.validate(clone2),/Uncited/);
 const clone3=structuredClone(data);clone3.items.find(x=>x.id==='norse').affiliations.push({university:'Fake University',country:'France',source:'https://example.com'});
 assert.throws(()=>atlas.validate(clone3),/Uncited|misplaced/);
});

test('unknown and not applicable affiliation status never overlap',()=>{
 assert.ok(atlas.filter(items,{country:'unknown'}).every(x=>x.type==='paper'));
 assert.ok(atlas.filter(items,{country:'not_applicable'}).every(x=>x.type!=='paper'));
 assert.equal(atlas.filter(items,{country:'not_applicable',format:'paper'}).length,0);
});
test('multi topic OR and AND differ and remain deterministic',()=>{
 const options={topics:['neuron-dynamics','event-vision'],format:'paper'};
 const any=atlas.filter(items,{...options,topicMode:'any'});
 const both=atlas.filter(items,{...options,topicMode:'all'});
 assert.ok(any.length>both.length);
 assert.ok(both.every(x=>options.topics.every(t=>x.topics.includes(t))));
});
test('affiliation coverage truthfully treats source list as partial',()=>{
 assert.equal(find('sew-resnet-2021').affiliationCoverage,'partial');
 assert.ok(find('sew-resnet-2021').affiliations.some(x=>x.university==='Peng Cheng Laboratory'));
 assert.equal(find('spike-htr-2026').affiliationCoverage,'unverified');
 assert.equal(find('norse').affiliationCoverage,'not_applicable');
});
