/* Pure, dimensionless forward-Euler neuron reference, no dependencies.
   Each call returns 201 post-reset samples for t = 0..200 ms.
   A spike at t+1 follows threshold crossing at the end of interval t. */
(function (root) {
  "use strict";
  const DT=1,DURATION=200;
  const defaults=Object.freeze({tau:20,threshold:0.85,current:1.55,mode:"step",compare:true});
  function currentAt(t,p) {
    if(t<12 || t>=188)return 0;
    if(p.mode==="pulses")return (t-12)%40<22?p.current*1.75:0;
    return p.current;
  }
  function simulate(model, p=defaults) {
    if(model!=="LIF" && model!=="IF")throw new RangeError("Unknown neuron model");
    const fields=[p.tau,p.threshold,p.current];
    if(!fields.every(Number.isFinite)||p.tau<=0||p.threshold<=0||p.current<0||
       !["step","pulses"].includes(p.mode))throw new RangeError("Invalid neuron settings");
    let v=0; const traces=[0],unreset=[0],spikeTimes=[],input=[];
    for(let t=0;t<DURATION;t++){
      const i=currentAt(t,p);
      // Same input gain 1/tau for both models; IF omits only the leak -V.
      const before=v+(DT/p.tau)*(i-(model==="LIF"?v:0));
      const fired=before>=p.threshold;
      if(fired)spikeTimes.push(t+1);
      v=fired?0:before;
      traces.push(v);unreset.push(before);input.push(i);
    }
    return {model,traces,unreset,spikeTimes,input,durationMs:DURATION,dtMs:DT,
      firingRateHz:spikeTimes.length/(DURATION/1000),
      meanISI:spikeTimes.length>1?(spikeTimes.at(-1)-spikeTimes[0])/(spikeTimes.length-1):null};
  }
  const api=Object.freeze({DT,DURATION,defaults,currentAt,simulate});
  if(typeof module!=="undefined" && module.exports)module.exports=api;
  root.SNNCore=api;
})(typeof window!=="undefined"?window:globalThis);
