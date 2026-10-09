/* SNN Community portal. Source of truth: neuron-core.js + resources.json. */
"use strict";
(() => {
  const $=id=>document.getElementById(id);
  const core=window.SNNCore;
  if(!core)throw new Error("neuron-core.js must load before app.js");
  const {DURATION,DT,defaults}=core;
  const state={...defaults};
  const controls={tau:$("tau"),threshold:$("threshold"),current:$("current")};
  const presetConfigs={
    quiet:{tau:20,threshold:1.10,current:0.50,mode:"step",compare:true},
    regular:{...defaults},
    burst:{tau:12,threshold:0.75,current:1.60,mode:"pulses",compare:true}
  };
  const canvas=$("lif-canvas"),ctx=canvas?.getContext?.("2d");
  let latest=null,resizeFrame=0;
  const feedback=message=>{if($("lab-feedback"))$("lab-feedback").textContent=message;};
  function resetShareField(){if($("share-fallback"))$("share-fallback").hidden=true;}
  function syncUI() {
    for(const [key,el] of Object.entries(controls))el.value=String(state[key]);
    for(const el of document.querySelectorAll('input[name="input-mode"]'))el.checked=el.value===state.mode;
    if($("compare-if"))$("compare-if").checked=Boolean(state.compare);
    $("tau-value").textContent=state.tau+" ms";
    $("threshold-value").textContent=state.threshold.toFixed(2);
    $("current-value").textContent=state.current.toFixed(2);
    for(const button of document.querySelectorAll(".preset-button")) {
      const cfg=presetConfigs[button.dataset.preset];
      button.setAttribute("aria-pressed",String(Object.entries(cfg).every(([k,v])=>state[k]===v)));
    }
  }
  function importURL() {
    const query=new URLSearchParams(window.location.search);
    for(const key of ["tau","threshold","current"]) {
      const value=query.get(key),el=controls[key];
      if(value===null||value.trim()==="")continue;
      const v=Number(value),min=Number(el.min),max=Number(el.max),step=Number(el.step);
      if(!Number.isFinite(v)||v<min||v>max)continue;
      state[key]=Number(Math.max(min,Math.min(max,min+Math.round((v-min)/step)*step)).toFixed(5));
    }
    if(["step","pulses"].includes(query.get("mode")))state.mode=query.get("mode");
    if(["0","1"].includes(query.get("compare")))state.compare=query.get("compare")==="1";
  }
  function clearImported() {
    if(window.location.protocol==="file:"||!window.history?.replaceState)return;
    const u=new URL(window.location.href);
    let dirty=false;
    for(const k of ["tau","threshold","current","mode","compare"])
      if(u.searchParams.has(k)){u.searchParams.delete(k);dirty=true;}
    if(dirty)window.history.replaceState(window.history.state,"",u.pathname+u.search+u.hash);
  }
  function updateExperiment(message) {
    clearImported();resetShareField();syncUI();paint();
    if(message)feedback(message);
  }
  importURL();
  const config=()=>({models:state.compare?["LIF","IF"]:["LIF"],integration:"forward_euler",
    dt_ms:DT,duration_ms:DURATION,reset:"hard_to_zero",initial_voltage:0,
    tau_ms:state.tau,threshold:state.threshold,amplitude:state.current,
    input_pattern:state.mode,comparison_same_input_gain:true});
  function shareURL(){
    const u=new URL("https://snncommunity.github.io/.github/");
    for(const k of ["tau","threshold","current","mode"])
      u.searchParams.set(k,String(state[k]));
    u.searchParams.set("compare",state.compare?"1":"0");
    u.hash="lab";return u.href;
  }
  function download(blob,filename) {
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function toCSV(main,other){
    const rows=["# SNNCommunity dimensionless discrete-time neuron models; forward Euler dt_ms=1; hard reset to zero",
      "# config="+JSON.stringify(config()),
      "time_ms,input_previous_interval,lif_after_reset,lif_pre_reset,lif_spike,if_after_reset,if_pre_reset,if_spike"];
    const lifEvents=new Set(main.spikeTimes),ifEvents=new Set(other?.spikeTimes||[]);
    for(let t=0;t<=DURATION;t++){
      const input=t===0?"":main.input[t-1].toFixed(8);
      rows.push([t,input,main.traces[t].toFixed(8),main.unreset[t].toFixed(8),lifEvents.has(t)?1:0,
        other?other.traces[t].toFixed(8):"",other?other.unreset[t].toFixed(8):"",
        other?(ifEvents.has(t)?1:0):""].join(","));
    }
    return rows.join("\n")+"\n";
  }
  function setCanvas() {
    if(!ctx)return null;
    const bounds=canvas.getBoundingClientRect(),w=Math.max(270,bounds.width||600),
      h=Math.max(300,bounds.height||400),dpr=Math.min(window.devicePixelRatio||1,2);
    const cw=Math.round(w*dpr),ch=Math.round(h*dpr);
    if(canvas.width!==cw)canvas.width=cw;
    if(canvas.height!==ch)canvas.height=ch;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    return {w,h};
  }
  function paint() {
    const main=core.simulate("LIF",state),other=state.compare?core.simulate("IF",state):null;
    latest={main,other};
    $("spike-count").textContent=String(main.spikeTimes.length);
    $("isi-stat").textContent=main.meanISI===null?"—":main.meanISI.toFixed(1)+" ms";
    $("if-count").textContent=other?String(other.spikeTimes.length):"Off";
    $("if-rate").textContent=other?other.firingRateHz.toFixed(0)+" Hz":"—";
    $("lif-rate").textContent=main.firingRateHz.toFixed(0)+" Hz";
    $("experiment-summary").textContent="Over "+DURATION+" ms, LIF emitted "+main.spikeTimes.length+
      " spikes ("+main.firingRateHz.toFixed(0)+" Hz). "+
      (other?"Matched-gain IF without leak emitted "+other.spikeTimes.length+" spikes ("+
       other.firingRateHz.toFixed(0)+" Hz). ":"Comparison is disabled. ")+
      "Threshold "+state.threshold.toFixed(2)+", input "+state.mode+
      ", τ "+state.tau+" ms; 201 post-reset voltage samples.";
    const dim=setCanvas();if(!dim)return;
    const {w,h}=dim,marginLeft=w<420?39:56,marginRight=12,plotRight=w-marginRight,
      X=t=>marginLeft+(plotRight-marginLeft)*t/DURATION;
    const pad=25,p1={top:26,bottom:h*.24},p2={top:h*.30,bottom:h*.76},p3={top:h*.81,bottom:h*.93};
    const drawLabel=(text,x,y,align="left")=>{ctx.textAlign=align;ctx.fillStyle="#445e59";ctx.font=(w<420?"11px":"12px")+" system-ui";ctx.fillText(text,x,y);};
    const gridPanel=(p)=>{ctx.strokeStyle="#dce5de";ctx.lineWidth=1;for(let t=0;t<=DURATION;t+=40){const x=X(t);ctx.beginPath();ctx.moveTo(x,p.top);ctx.lineTo(x,p.bottom);ctx.stroke();}ctx.beginPath();ctx.moveTo(marginLeft,p.bottom);ctx.lineTo(plotRight,p.bottom);ctx.stroke();};
    [p1,p2,p3].forEach(gridPanel);
    drawLabel("INPUT I (normalized)",marginLeft,p1.top-10);
    drawLabel("MEMBRANE V (normalized)",marginLeft,p2.top-10);
    drawLabel("SPIKES",marginLeft,p3.top-8);
    const gainMax=Math.max(state.current*1.75,0.5);
    const Yinput=value=>p1.bottom-4-(p1.bottom-p1.top-10)*(value/gainMax);
    ctx.strokeStyle="#ad7048";ctx.lineWidth=2.2;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(X(0),Yinput(main.input[0]));
    for(let t=0;t<DURATION;t++){ctx.lineTo(X(t+1),Yinput(main.input[t]));if(t+1<DURATION)ctx.lineTo(X(t+1),Yinput(main.input[t+1]));}
    ctx.stroke();
    const vmax=Math.max(1.5,state.threshold*1.18,state.current*.7);
    const Yv=v=>p2.bottom-4-(p2.bottom-p2.top-12)*v/vmax;
    ctx.save();ctx.setLineDash([6,4]);ctx.strokeStyle="#b97b48";ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(marginLeft,Yv(state.threshold));ctx.lineTo(plotRight,Yv(state.threshold));ctx.stroke();ctx.restore();
    drawLabel("Vth "+state.threshold.toFixed(2),plotRight,Yv(state.threshold)-5,"right");
    const drawVoltage=(result,color,dashed)=>{
      ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash(dashed?[5,4]:[]);ctx.lineJoin="round";
      const fired=new Set(result.spikeTimes);ctx.beginPath();ctx.moveTo(X(0),Yv(0));
      for(let t=1;t<=DURATION;t++){
        if(fired.has(t)){ctx.lineTo(X(t),Yv(result.unreset[t]));ctx.lineTo(X(t),Yv(0));}
        else ctx.lineTo(X(t),Yv(result.traces[t]));
      }
      ctx.stroke();ctx.restore();
    };
    drawVoltage(main,"#217b68",false);
    if(other)drawVoltage(other,"#536db0",true);
    ctx.strokeStyle="#237c6a";ctx.lineWidth=2.5;
    main.spikeTimes.forEach(t=>{ctx.beginPath();ctx.moveTo(X(t),p3.top+5);ctx.lineTo(X(t),p3.top+23);ctx.stroke();});
    if(other){ctx.strokeStyle="#536db0";other.spikeTimes.forEach(t=>{ctx.beginPath();ctx.moveTo(X(t),p3.top+30);ctx.lineTo(X(t),p3.top+47);ctx.stroke();});}
    drawLabel("LIF",marginLeft,p3.top+18);if(other)drawLabel("IF",marginLeft,p3.top+44);
    for(let t=0;t<=DURATION;t+=40)drawLabel(String(t),X(t),h-12,"center");
    drawLabel("Time (ms)",plotRight,h-1,"right");
  }
  let pending=0;
  const schedule=()=>{if(pending)return;pending=requestAnimationFrame(()=>{pending=0;paint();});};
  if(typeof ResizeObserver!=="undefined"){
    const observer=new ResizeObserver(schedule);
    if(canvas?.parentElement)observer.observe(canvas.parentElement);
  }else window.addEventListener("resize",schedule);
  for(const [key,el] of Object.entries(controls))el?.addEventListener("input",()=>{
    state[key]=Number(el.value);updateExperiment();
  });
  for(const el of document.querySelectorAll('input[name="input-mode"]'))
    el.addEventListener("change",()=>{if(el.checked){state.mode=el.value;updateExperiment();}});
  $("compare-if")?.addEventListener("change",e=>{
    state.compare=Boolean(e.currentTarget.checked);updateExperiment("Model comparison updated.");
  });
  for(const button of document.querySelectorAll(".preset-button"))
    button.addEventListener("click",()=>{
      Object.assign(state,presetConfigs[button.dataset.preset]);updateExperiment(button.textContent+" loaded.");
    });
  $("reset-lab")?.addEventListener("click",()=>{
    Object.assign(state,defaults);updateExperiment("Default experiment restored.");
  });
  $("copy-config")?.addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(JSON.stringify(config(),null,2));feedback("JSON configuration copied.");}
    catch(e){feedback("Clipboard unavailable; export CSV for a saved record.");}
  });
  $("share-lab")?.addEventListener("click",async()=>{
    const url=shareURL();
    try{await navigator.clipboard.writeText(url);$("share-fallback").hidden=true;feedback("Shareable experiment URL copied.");}
    catch(e){$("share-url").value=url;$("share-fallback").hidden=false;$("share-url").focus();$("share-url").select();feedback("Copy the selected experiment link manually.");}
  });
  $("export-csv")?.addEventListener("click",()=>{
    if(!latest)paint();
    download(new Blob([toCSV(latest.main,latest.other)],{type:"text/csv;charset=utf-8"}),"snncommunity-model-comparison.csv");
    feedback("CSV exported: 201 states with input, pre-reset and post-reset voltages.");
  });
  $("export-png")?.addEventListener("click",()=>{
    if(!canvas?.toBlob){feedback("PNG export unavailable.");return;}
    canvas.toBlob(blob=>{if(blob){download(blob,"snncommunity-neuron-models.png");feedback("Plot saved.");}else feedback("Plot export failed.");},"image/png");
  });

  // Static source index. Never infer project authorship, license or reproduction.
  const cards=$("resource-grid"),count=$("resource-count"),search=$("resource-search"),empty=$("resource-empty"),more=$("resource-more");
  const initialResourceLimit=6;
  let all=[],category="all",expanded=false;
  function node(tag,className,textContent){const el=document.createElement(tag);if(className)el.className=className;if(textContent!==undefined)el.textContent=String(textContent);return el;}
  function renderResources() {
    const q=(search?.value||"").toLowerCase().trim();
    const filtered=all.filter(x=>(category==="all"||x.category===category)&&
      [x.title,x.description,x.publisher,x.type,x.doi||""].join(" ").toLowerCase().includes(q));
    // Show a readable sample first; filtered/search results always show every match.
    const focused=Boolean(q)||category!=="all";
    const visible=focused||expanded?filtered:filtered.slice(0,initialResourceLimit);
    const fragment=document.createDocumentFragment();
    for(const x of visible){
      const card=node("article","resource-card");
      const top=node("div","resource-card-head");
      // No decorative link arrow on a non-clickable card container.
      top.append(node("span","resource-label",x.category+" · "+x.type));
      card.append(top,node("h3","",x.title),node("p","",x.description));
      const meta=node("div","resource-metadata");
      meta.append(node("span","",x.publisher+(x.year?" · "+x.year:"")));
      meta.append(node("span","resource-review","Indexed · Not reproduced"));
      if(x.doi){const a=node("a","resource-doi","DOI ↗");a.href="https://doi.org/"+encodeURIComponent(x.doi);a.target="_blank";a.rel="noopener noreferrer";a.setAttribute("aria-label","DOI for "+x.title);meta.append(a);}
      if(x.code){const a=node("a","resource-doi","Code ↗");a.href=x.code;a.target="_blank";a.rel="noopener noreferrer";a.setAttribute("aria-label","Original code for "+x.title);meta.append(a);}
      const license=node("span","resource-license",x.license||x.licenseNote);
      if(x.licenseUrl){const a=node("a","resource-doi","Upstream license ↗");a.href=x.licenseUrl;a.target="_blank";a.rel="noopener noreferrer";meta.append(a);}
      meta.append(license);
      const open=node("a","resource-main-link","Visit original source ↗");
      open.href=x.url;open.target="_blank";open.rel="noopener noreferrer";open.setAttribute("aria-label","Visit original source: "+x.title);
      card.append(meta,open);fragment.append(card);
    }
    cards.replaceChildren(fragment);empty.hidden=filtered.length!==0;
    if(more){
      more.hidden=focused||filtered.length<=initialResourceLimit;
      more.setAttribute("aria-expanded",String(expanded));
      more.firstChild.textContent=expanded?"Show fewer resources ":"View all "+filtered.length+" resources ";
      more.lastElementChild.textContent=expanded?"↑":"↓";
    }
    count.textContent=focused
      ?"Showing "+visible.length+" matching resources · "+all.length+" indexed"
      :"Showing "+visible.length+" of "+all.length+" curated resources";
  }
  more?.addEventListener("click",()=>{
    expanded=!expanded;
    renderResources();
  });
  document.querySelectorAll(".filter-chip").forEach(button=>button.addEventListener("click",()=>{
    category=button.dataset.filter||"all";
    expanded=false;
    for(const other of document.querySelectorAll(".filter-chip")){
      const enabled=button===other;other.classList.toggle("active",enabled);other.setAttribute("aria-pressed",String(enabled));
    }
    renderResources();
  }));
  search?.addEventListener("input",renderResources);
  fetch("./resources.json").then(async res=>{
    if(!res.ok)throw Error("Resource catalog is unavailable");
    const body=await res.json();
    if(body.schemaVersion!==1||!Array.isArray(body.items))throw Error("Unsupported resource schema");
    all=body.items.filter(x=>typeof x.title==="string"&&/^https:\/\//.test(x.url)&&x.verification==="indexed_not_reproduced");
    renderResources();
  }).catch(()=>{if(count)count.textContent="Resource catalog unavailable. Please use the original links below.";const fallback=$("resource-fallback");if(fallback)fallback.hidden=false;});
  syncUI();paint();

  const menu=$("site-menu"),toggle=$("menu-toggle");
  toggle?.addEventListener("click",()=>{
    const next=toggle.getAttribute("aria-expanded")!=="true";
    toggle.setAttribute("aria-expanded",String(next));
    toggle.setAttribute("aria-label",next?"Close navigation":"Open navigation");
    menu?.classList.toggle("is-open",next);
  });
  menu?.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
    menu.classList.remove("is-open");toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Open navigation");
  }));
  window.addEventListener("keydown",e=>{if(e.key==="Escape"&&menu?.classList.contains("is-open")){
    menu.classList.remove("is-open");toggle.setAttribute("aria-expanded","false");toggle.focus();
  }});
})();
