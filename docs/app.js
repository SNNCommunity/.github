/* SNN Community portal — deterministic client-side examples, no network requests. */
"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const menuButton = $("menu-toggle");
  const menu = $("site-menu");
  menuButton?.addEventListener("click", () => {
    const next = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(next));
    menuButton.setAttribute("aria-label", next ? "Close navigation" : "Open navigation");
    menu?.classList.toggle("is-open", next);
  });
  menu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    menu.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  }));
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && menu?.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.focus();
    }
  });

  const resources = [
    { title:"snnTorch — Tutorials", tag:"learn", kind:"GUIDED LESSONS", description:"A practical progression from spike encoding and LIF neurons to surrogate-gradient training and event datasets.", source:"snnTorch", url:"https://snntorch.readthedocs.io/en/latest/tutorials/index.html" },
    { title:"SpikingJelly — Documentation", tag:"frameworks", kind:"PYTORCH FRAMEWORK", description:"A deep-learning framework for spiking networks with components, training utilities, and model examples.", source:"SpikingJelly", url:"https://spikingjelly.readthedocs.io/" },
    { title:"Norse", tag:"frameworks", kind:"NEURAL COMPUTING", description:"Open neural computation components designed to integrate differentiable spiking models with PyTorch.", source:"Norse", url:"https://github.com/norse/norse" },
    { title:"NeuroBench", tag:"evaluation", kind:"BENCHMARK SUITE", description:"Open benchmark methodology and code for evaluating neuromorphic models and systems.", source:"NeuroBench", url:"https://github.com/NeuroBench/neurobench" },
    { title:"Tonic", tag:"events", kind:"EVENT DATA", description:"Tools and datasets for event-based data loading, transformations and neuromorphic learning workflows.", source:"Tonic", url:"https://github.com/neuromorphs/tonic" },
    { title:"Neuromorphic Intermediate Representation", tag:"frameworks", kind:"MODEL INTEROPERABILITY", description:"NIR: a common representation for communicating spiking neural models across software and hardware systems.", source:"neuromorphs / NIR", url:"https://github.com/neuromorphs/NIR" },
    { title:"Training SNNs using Lessons from Deep Learning", tag:"learn", kind:"RESEARCH READING", description:"A broad tutorial review of spiking neural network training from a modern deep learning perspective.", source:"Eshraghian et al.", url:"https://arxiv.org/abs/2109.12894" },
    { title:"Surrogate Gradient Learning in SNNs", tag:"learn", kind:"RESEARCH READING", description:"A foundational review of learning with surrogate gradients in spiking neural networks.", source:"Neftci et al.", url:"https://arxiv.org/abs/1901.09948" },
    { title:"Event-based Vision: A Survey", tag:"events", kind:"RESEARCH SURVEY", description:"A survey introducing event cameras, representations, and event-based computer vision methods.", source:"Gallego et al.", url:"https://arxiv.org/abs/1904.08405" },
    { title:"snnTorch — Source Code", tag:"frameworks", kind:"OPEN SOURCE", description:"Reference implementation and development discussions for snnTorch spiking neural network tooling.", source:"snnTorch", url:"https://github.com/jeshraghian/snntorch" },
    { title:"Open Neuromorphic", tag:"events", kind:"WIDER ECOSYSTEM", description:"An independent community connecting research, neuromorphic hardware, events, and shared learning.", source:"Open Neuromorphic", url:"https://open-neuromorphic.org/" },
    { title:"NeuroBench — Documentation", tag:"evaluation", kind:"BENCHMARK REFERENCE", description:"Public API documentation describing model wrappers, evaluation components and metrics.", source:"NeuroBench docs", url:"https://neurobench.readthedocs.io/" }
  ];

  const cards = $("resource-grid");
  const search = $("resource-search");
  const count = $("resource-count");
  const empty = $("resource-empty");
  let activeTag = "all";
  function makeResource(resource) {
    const a = document.createElement("a");
    a.className = "resource-card";
    a.href = resource.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", resource.title + " — external resource (opens new tab)");
    const head = document.createElement("div");
    head.className = "resource-card-head";
    const kind = document.createElement("span");
    kind.className = "resource-label";
    kind.textContent = resource.kind;
    const arrow = document.createElement("span");
    arrow.className = "resource-arrow";
    arrow.setAttribute("aria-hidden","true");
    arrow.textContent = "↗";
    head.append(kind, arrow);
    const h = document.createElement("h3"); h.textContent=resource.title;
    const p = document.createElement("p"); p.textContent=resource.description;
    const bottom = document.createElement("div"); bottom.className="resource-card-bottom";
    const source=document.createElement("span"); source.textContent=resource.source;
    const badge=document.createElement("em"); badge.textContent="EXTERNAL LINK";
    bottom.append(source,badge);
    a.append(head,h,p,bottom);
    return a;
  }
  function renderResources() {
    const q = (search?.value || "").toLowerCase().trim();
    const selected = resources.filter(item => (activeTag === "all" || item.tag === activeTag) &&
      [item.title,item.description,item.source,item.kind,item.tag].some(s=>s.toLowerCase().includes(q)));
    cards?.replaceChildren(...selected.map(makeResource));
    if(count)count.textContent = selected.length + " of " + resources.length + " curated resources";
    if(empty)empty.hidden=selected.length!==0;
  }
  document.querySelectorAll(".filter-chip").forEach(button => {
    button.addEventListener("click", () => {
      activeTag = button.getAttribute("data-filter") || "all";
      document.querySelectorAll(".filter-chip").forEach(other => {
        const active = other === button;
        other.classList.toggle("active",active);
        other.setAttribute("aria-pressed",String(active));
      });
      renderResources();
    });
  });
  search?.addEventListener("input", renderResources);
  renderResources();

  const canvas = $("lif-canvas");
  const ctx = canvas?.getContext?.("2d");
  const configEls = {tau:$("tau"),threshold:$("threshold"),current:$("current")};
  const initial = {tau:20,threshold:0.85,current:1.55,mode:"step"};
  const state = {...initial};
  const simMs=200,dt=1;
  function currentInput(t) {
    if(state.mode==="pulses") return t >= 12 && t <= 188 && (t-12)%40<22 ? state.current*1.75 : 0;
    return t>=12&&t<188? state.current:0;
  }
  function simulate() {
    let v=0;
    const traces=[], spikeTimes=[], inputTrace=[];
    for(let t=0;t<=simMs;t+=dt) {
      const i=currentInput(t);
      v+=(dt/state.tau)*(-v+i);
      if (v>=state.threshold) {spikeTimes.push(t);v=0;}
      traces.push(v);inputTrace.push(i);
    }
    return {traces,spikeTimes,inputTrace};
  }
  let latestSim=null;
  function paint() {
    latestSim=simulate();
    $("tau-value").textContent=state.tau+" ms";
    $("threshold-value").textContent=state.threshold.toFixed(2);
    $("current-value").textContent=state.current.toFixed(2);
    $("spike-count").textContent=String(latestSim.spikeTimes.length);
    const n=latestSim.spikeTimes.length;
    $("isi-stat").textContent=n>=2?(latestSim.spikeTimes[n-1]-latestSim.spikeTimes[n-2])+" ms":"—";
    if(!ctx)return;
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(320,rect.width||800),h=Math.max(250,rect.height||350);
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const left=41,right=w-17,top=28,upperBottom=h*.56,spikeTop=h*.67,spikeBottom=h*.86;
    const sx=t=>left+(right-left)*t/simMs;
    const yMax=Math.max(1.45,state.threshold+0.2,state.current*.85);
    const sy=v=>upperBottom-(upperBottom-top)*v/yMax;
    ctx.font="11px system-ui, sans-serif";
    ctx.textBaseline="middle";
    ctx.strokeStyle="#dbe6dd";ctx.lineWidth=1;
    for(let v=0;v<=yMax+.001;v+=.25){
      const y=sy(v);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
    }
    for(let t=0;t<=simMs;t+=40){
      const x=sx(t);ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,spikeBottom);ctx.stroke();
      ctx.fillStyle="#81958b";ctx.textAlign="center";ctx.fillText(String(t),x,spikeBottom+19);
    }
    ctx.textAlign="left";ctx.fillStyle="#617e73";
    ctx.fillText("V(t)",4,top+6);ctx.fillText("spikes",4,spikeTop+6);
    ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle="#ca8059";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(left,sy(state.threshold));ctx.lineTo(right,sy(state.threshold));ctx.stroke();ctx.restore();
    ctx.strokeStyle="#267d6b";ctx.lineWidth=2.35;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();
    latestSim.traces.forEach((v,t)=>{const x=sx(t),y=sy(v);if(t===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
    ctx.stroke();
    ctx.strokeStyle="#719e9c";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,spikeBottom);ctx.lineTo(right,spikeBottom);ctx.stroke();
    ctx.strokeStyle="#318a80";ctx.lineWidth=2.6;
    latestSim.spikeTimes.forEach(t=>{const x=sx(t);ctx.beginPath();ctx.moveTo(x,spikeBottom);ctx.lineTo(x,spikeTop);ctx.stroke();});
    ctx.fillStyle="#7c9084";ctx.font="10px system-ui, sans-serif";ctx.textAlign="right";ctx.fillText("TIME (ms)",right,spikeBottom+35);
  }
  for(const [key,el] of Object.entries(configEls)){
    el?.addEventListener("input",()=>{state[key]=Number(el.value);paint();});
  }
  document.querySelectorAll('input[name="input-mode"]').forEach(el=>el.addEventListener("change",()=>{if(el.checked){state.mode=el.value;paint();}}));
  $("reset-lab")?.addEventListener("click",()=>{
    Object.assign(state,initial);
    for(const [key,el] of Object.entries(configEls))el.value=String(state[key]);
    document.querySelectorAll('input[name="input-mode"]').forEach(el=>{el.checked=el.value===state.mode;});
    paint();
  });
  $("copy-config")?.addEventListener("click",async(event)=>{
    const payload=JSON.stringify({model:"LIF",integration:"forward_euler",dt_ms:1,duration_ms:200,reset:"hard_to_zero",initial_voltage:0,tau_ms:state.tau,threshold:state.threshold,amplitude:state.current,input_pattern:state.mode},null,2);
    const button=event.currentTarget, original="Copy config ↗";
    try{
      if(!navigator.clipboard?.writeText)throw new Error("Clipboard is not available");
      await navigator.clipboard.writeText(payload);
      button.textContent="Copied ✓";
      window.setTimeout(()=>{button.textContent=original;},1800);
    }catch(e){
      button.textContent="Clipboard unavailable";
      button.title=payload;
      window.setTimeout(()=>{button.textContent=original;},2100);
    }
  });
  let observer;
  if(typeof ResizeObserver!=="undefined") {
    observer=new ResizeObserver(()=>{window.requestAnimationFrame(paint);});
    if(canvas)observer.observe(canvas);
  } else window.addEventListener("resize",paint);
  paint();
})();
