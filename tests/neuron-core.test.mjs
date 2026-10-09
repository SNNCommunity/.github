import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require=createRequire(import.meta.url);
const core=require('../docs/neuron-core.js');
const examples=[
  {tau:20,threshold:0.85,current:1.55,mode:'step',compare:true},
  {tau:12,threshold:0.75,current:1.60,mode:'pulses',compare:true},
  {tau:20,threshold:1.10,current:0.50,mode:'step',compare:true},
  {tau:5,threshold:0.45,current:2.30,mode:'pulses',compare:true},
  {tau:45,threshold:1.30,current:0.50,mode:'step',compare:false}
];
test('LIF and IF return exactly 201 samples and 200 input intervals',()=>{
 for(const settings of examples)for(const model of ['LIF','IF']){
  const r=core.simulate(model,settings);
  assert.equal(r.traces.length,201);
  assert.equal(r.unreset.length,201);
  assert.equal(r.input.length,200);
  assert.ok(r.spikeTimes.every(t=>Number.isInteger(t)&&t>=1&&t<=200));
  const events=new Set(r.spikeTimes);
  for(let t=1;t<=200;t++){
    assert.equal(r.traces[t]===0 && events.has(t),events.has(t));
    if(events.has(t))assert.ok(r.unreset[t]>=settings.threshold-1e-12);
    if(!events.has(t))assert.ok(r.traces[t]<settings.threshold+1e-12);
  }
 }
});
test('nonleaky comparison uses identical input with and without leak',()=>{
 const a=core.simulate('LIF',examples[0]),b=core.simulate('IF',examples[0]);
 assert.deepEqual(a.input,b.input);
 assert.ok(b.spikeTimes.length>=a.spikeTimes.length);
 assert.equal(core.simulate('LIF',examples[2]).spikeTimes.length,0);
});
test('independent Python reference agrees with browser numerical core',()=>{
 for(const settings of examples)for(const model of ['LIF','IF']){
  const cmd=['experiments/lif-reference/run.py','--model',model,
    '--tau',String(settings.tau),'--threshold',String(settings.threshold),
    '--current',String(settings.current),'--mode',settings.mode];
  const run=spawnSync('python3',cmd,{encoding:'utf8',timeout:10000});
  assert.equal(run.status,0,run.stderr);
  const ref=JSON.parse(run.stdout),js=core.simulate(model,settings);
  assert.deepEqual(js.spikeTimes,ref.spikeTimes);
  assert.equal(js.traces.length,ref.traces.length);
  for(const field of ['traces','unreset','input']){
    assert.equal(js[field].length,ref[field].length);
    for(let t=0;t<js[field].length;t++){
      assert.ok(Math.abs(js[field][t]-ref[field][t])<=1e-12,
      model+' '+settings.mode+' '+field+' t='+t);
    }
  }
 }
});
