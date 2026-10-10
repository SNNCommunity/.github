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

  // Research Atlas. DOM, URL and history use one normalized state model.
  const atlas=window.SNNAtlas;
  if(!atlas)throw Error("atlas-core.js must load before app.js");
  const cards=$("resource-grid"),count=$("resource-count"),search=$("resource-search"),
    empty=$("resource-empty"),more=$("resource-more"),topicBar=$("atlas-topics");
  const facetIds={format:"atlas-format",year:"atlas-year",venueType:"atlas-venue-type",
    venue:"atlas-venue",country:"atlas-country",university:"atlas-university",sort:"atlas-sort"};
  const facetEls=Object.fromEntries(Object.entries(facetIds).map(([k,id])=>[k,$(id)]));
  const initialResourceLimit=6;
  const facetKeys=Object.keys(facetIds);
  let all=[],topics=[],selectedTopics=new Set(),topicMode="any",displayLimit=initialResourceLimit;
  const topicName=id=>topics.find(t=>t.id===id)?.label||id;
  function node(tag,className,value){
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(value!==undefined)el.textContent=String(value);
    return el;
  }
  function link(href,label,cssClass,aria){
    const a=node("a",cssClass,label);
    a.href=href;a.target="_blank";a.rel="noopener noreferrer";
    if(aria)a.setAttribute("aria-label",aria);
    return a;
  }
  function optionExists(el,value){return [...el.options].some(o=>o.value===value);}
  function setOption(el,value){el.value=optionExists(el,value)?value:"all";}
  function fillOptions(el,values){
    if(!el)return;
    const initial=el.options[0].cloneNode(true),preserved=[initial];
    if(el.id==="atlas-country"){
      preserved.push(new Option("Not verified · paper","unknown"));
      preserved.push(new Option("Not applicable · resource","not_applicable"));
    }
    el.replaceChildren(...preserved,...values.map(v=>new Option(String(v),String(v))));
  }
  function refreshDependentOptions(country,venueType){
    const priorUniversity=facetEls.university.value,priorVenue=facetEls.venue.value;
    const f=atlas.facets(all);
    fillOptions(facetEls.university,
      country==="unknown"||country==="not_applicable"?[]:f.universities(country));
    const pool=all.filter(x=>x.publication&&(venueType==="all"||x.publication.kind===venueType));
    fillOptions(facetEls.venue,atlas.facets(pool).venues);
    setOption(facetEls.university,priorUniversity);
    setOption(facetEls.venue,priorVenue);
  }
  const selections=()=>({
    query:search?.value||"",topics:[...selectedTopics],topicMode,
    ...Object.fromEntries(Object.entries(facetEls).map(([k,el])=>[k,el.value]))
  });
  const getURLState=()=>{
    const q=new URLSearchParams(location.search);
    const values=Object.fromEntries(facetKeys.map(k=>[k,q.get("atlas."+k)||"all"]));
    return {
      topics:(q.get("atlas.topic")||"").split(",").filter(id=>topics.some(t=>t.id===id)),
      topicMode:q.get("atlas.mode")==="all"?"all":"any",
      query:q.get("atlas.query")||"",...values
    };
  };
  function restoreAtlasURL(){
    const next=getURLState(),facets=atlas.facets(all);
    selectedTopics=new Set(next.topics);
    topicMode=next.topicMode;$("atlas-topic-mode").value=topicMode;
    search.value=next.query;
    fillOptions(facetEls.year,facets.years);
    fillOptions(facetEls.country,facets.countries);
    setOption(facetEls.country,next.country);
    setOption(facetEls.year,next.year);
    setOption(facetEls.format,next.format);
    setOption(facetEls.venueType,next.venueType);
    setOption(facetEls.sort,next.sort==="all"?"recent":next.sort);
    refreshDependentOptions(facetEls.country.value,facetEls.venueType.value);
    setOption(facetEls.university,next.university);
    setOption(facetEls.venue,next.venue);
    displayLimit=initialResourceLimit;
    renderTopics();renderResources();
  }
  function toAtlasURL(clean){
    const u=clean?new URL(location.pathname,location.origin):new URL(location.href);
    const q=u.searchParams;
    for(const key of ["topic","mode","query",...facetKeys])q.delete("atlas."+key);
    const f=selections();
    if(f.topics.length)q.set("atlas.topic",[...f.topics].sort().join(","));
    if(f.topicMode==="all")q.set("atlas.mode","all");
    if(f.query.trim())q.set("atlas.query",f.query.trim());
    for(const key of facetKeys){
      if(f[key]!=="all"&&!(key==="sort"&&f[key]==="recent"))
        q.set("atlas."+key,f[key]);
    }
    if(clean)u.hash="library";
    return u;
  }
  function writeAtlasURL(method="push"){
    if(location.protocol==="file:"||!history.replaceState)return;
    const u=toAtlasURL(false);
    if(u.href!==location.href)
      history[method==="replace"?"replaceState":"pushState"](history.state,"",u.pathname+u.search+u.hash);
  }
  function renderTopics(){
    const fragment=document.createDocumentFragment(),base=selections();
    const without={...base,topics:[]},counts=atlas.topicCounts(all,without,topics);
    const total=atlas.filter(all,without,topics).length;
    for(const t of [{id:"all",label:"All research"},...topics]){
      const button=node("button","atlas-topic",t.label);
      button.type="button";button.dataset.topic=t.id;
      const active=t.id==="all"?!selectedTopics.size:selectedTopics.has(t.id);
      button.classList.toggle("is-selected",active);
      button.setAttribute("aria-pressed",String(active));
      const n=t.id==="all"?total:(counts.get(t.id)||0);
      button.append(node("span","atlas-topic-count",n));
      button.setAttribute("aria-label",t.label+" · "+n+" matches under other filters");
      button.addEventListener("click",()=>{
        if(t.id==="all")selectedTopics.clear();
        else if(selectedTopics.has(t.id))selectedTopics.delete(t.id);
        else selectedTopics.add(t.id);
        displayLimit=initialResourceLimit;
        renderTopics();renderResources();writeAtlasURL("push");
      });
      fragment.append(button);
    }
    topicBar.replaceChildren(fragment);
  }
  function addLinkIf(parent,href,label,aria){
    if(href&&/^https:\/\//.test(href))parent.append(link(href,label,"resource-detail-link",aria));
  }
  function renderCard(x){
    const card=node("article","resource-card atlas-card"),
      pub=x.publication,affs=x.affiliations||[],paper=x.type==="paper";
    const top=node("div","resource-card-head");
    top.append(node("span","resource-label",paper?"RESEARCH PAPER":"OPEN RESOURCE"));
    if(pub)top.append(node("span","atlas-venue-label",pub.venue+" · "+pub.year));
    const heading=node("h3");
    if(paper){
      const a=node("a","atlas-title-link",x.title);
      a.href="./papers/"+encodeURIComponent(x.id)+"/";heading.append(a);
    }else heading.textContent=x.title;
    card.append(top,heading);
    const tags=node("div","atlas-card-topics");
    for(const id of x.topics.slice(0,3))tags.append(node("span","atlas-tag",topicName(id)));
    card.append(tags,node("p","",x.description));
    const summary=node("div","atlas-card-summary");
    if(paper&&(x.authorships||[]).length){
      const names=x.authorships.map(a=>a.name);
      summary.append(node("span","atlas-authors",names.length>3?
        names.slice(0,3).join(", ")+" et al.":names.join(", ")));
    }else summary.append(node("span","",x.publisher));
    if(paper){
      const countries=[...new Set(affs.map(a=>a.country))];
      summary.append(node("span","atlas-affiliation-hint",countries.length?
        "Selected affiliations · "+countries.join(" · "):"Author affiliations · Not yet indexed"));
    }else summary.append(node("span","atlas-affiliation-hint","Academic affiliation · Not applicable"));
    card.append(summary);
    const details=node("details","resource-evidence");
    details.append(node("summary","","Publication & evidence"));
    const inner=node("div","resource-evidence-body");
    if(pub)inner.append(node("div","resource-evidence-line",pub.kind+" · "+pub.venue+" · "+pub.year));
    if(paper){
      inner.append(node("strong","resource-aff-heading","Publication affiliations (partial unless reviewed)"));
      if(affs.length){
        const list=node("ul","resource-aff-list");
        for(const a of affs){
          const li=node("li");
          li.append(document.createTextNode(a.university+" · "+a.country+" "));
          addLinkIf(li,a.source,"Source ↗","Published affiliation source for "+x.title);
          list.append(li);
        }
        inner.append(list);
      }else inner.append(node("p","resource-aff-unknown","Institution coverage has not been verified."));
    }else inner.append(node("p","resource-aff-unknown","Academic author affiliations do not apply to this resource."));
    const links=node("div","resource-evidence-links");
    if(x.doi)addLinkIf(links,"https://doi.org/"+x.doi,"DOI ↗",null);
    addLinkIf(links,x.bibliographySource,"Publication ↗",null);
    addLinkIf(links,x.code,"Linked code ↗",null);
    addLinkIf(links,x.licenseUrl,"License ↗",null);
    inner.append(links,node("p","resource-review","Indexed; no independent paper reproduction recorded"));
    inner.append(node("p","resource-license",x.license||x.licenseNote));
    details.append(inner);card.append(details);
    const actions=node("div","atlas-card-actions");
    if(paper){
      const a=node("a","atlas-record-link","Explore research record →");
      a.href="./papers/"+encodeURIComponent(x.id)+"/";actions.append(a);
    }
    actions.append(link(x.url,paper?"Original paper ↗":"Original source ↗",
      "resource-main-link","Original source: "+x.title));
    card.append(actions);
    return card;
  }
  const formatButtons=[...document.querySelectorAll(".atlas-kind")];
  function syncFormatButtons(){
    for(const button of formatButtons){
      const selected=button.dataset.format===facetEls.format.value;
      button.classList.toggle("is-selected",selected);
      button.setAttribute("aria-pressed",String(selected));
    }
  }
  function renderResources(){
    syncFormatButtons();
    const selected=selections(),filtered=atlas.filter(all,selected,topics);
    const visible=filtered.slice(0,displayLimit);
    const fragment=document.createDocumentFragment();
    for(const x of visible)fragment.append(renderCard(x));
    cards.replaceChildren(fragment);
    empty.hidden=filtered.length!==0;
    if(more){
      more.hidden=filtered.length<=initialResourceLimit;
      more.parentElement.hidden=more.hidden;
      more.setAttribute("aria-expanded",String(displayLimit>=filtered.length));
      more.firstChild.textContent=displayLimit>=filtered.length?
        "Show fewer resources ":"Load more resources ";
      more.lastElementChild.textContent=displayLimit>=filtered.length?"↑":"↓";
    }
    count.textContent="Showing "+visible.length+" of "+filtered.length+
      " matches · "+all.length+" indexed records ("+all.filter(x=>x.type==="paper").length+" papers)";
    renderFilterChips(selected);
  }
  function resetFacet(key){
    facetEls[key].value=key==="sort"?"recent":"all";
    if(key==="country"||key==="venueType")
      refreshDependentOptions(facetEls.country.value,facetEls.venueType.value);
  }
  function renderFilterChips(selected){
    const wrap=$("atlas-active-filters");if(!wrap)return;
    const fragment=document.createDocumentFragment();
    const chip=(label,callback)=>{
      const button=node("button","atlas-active-chip",label+" ×");
      button.type="button";button.setAttribute("aria-label","Remove "+label+" filter");
      button.addEventListener("click",()=>{
        callback();displayLimit=initialResourceLimit;
        renderTopics();renderResources();writeAtlasURL("push");
        search.focus();
      });
      fragment.append(button);
    };
    if(selected.query.trim())chip("Search: "+selected.query,()=>search.value="");
    for(const id of selectedTopics)chip(topicName(id),()=>selectedTopics.delete(id));
    for(const [key,el] of Object.entries(facetEls)){
      if(el.value!=="all"&&!(key==="sort"&&el.value==="recent"))
        chip(el.selectedOptions[0]?.textContent||el.value,()=>resetFacet(key));
    }
    if(!fragment.childNodes.length)
      fragment.append(node("span","atlas-active-idle","Showing the complete curated index."));
    wrap.replaceChildren(fragment);
  }
  function updateFilters(method="push"){
    displayLimit=initialResourceLimit;
    renderTopics();renderResources();writeAtlasURL(method);
  }
  for(const button of formatButtons){
    button.addEventListener("click",()=>{
      facetEls.format.value=button.dataset.format;
      updateFilters();
    });
  }
  $("atlas-topic-mode")?.addEventListener("change",e=>{
    topicMode=e.target.value;updateFilters();
  });
  $("atlas-copy")?.addEventListener("click",async()=>{
    const url=toAtlasURL(true).href;
    try{
      if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      $("atlas-copy-fallback").hidden=true;
      $("atlas-copy-status").textContent="Clean research link copied.";
    }catch{
      $("atlas-copy-fallback").hidden=false;
      $("atlas-copy-input").value=url;
      $("atlas-copy-input").focus();$("atlas-copy-input").select();
      $("atlas-copy-status").textContent="Select the clean link below and copy it.";
    }
  });
  window.addEventListener("popstate",()=>{
    if(all.length)restoreAtlasURL();
  });
  more?.addEventListener("click",()=>{
    const length=atlas.filter(all,selections(),topics).length;
    displayLimit=displayLimit>=length?initialResourceLimit:Math.min(length,displayLimit+12);
    renderResources();
  });
  search?.addEventListener("input",()=>updateFilters("replace"));
  for(const [key,el] of Object.entries(facetEls))el?.addEventListener("change",()=>{
    if(key==="country"||key==="venueType")
      refreshDependentOptions(facetEls.country.value,facetEls.venueType.value);
    updateFilters();
  });
  $("atlas-reset")?.addEventListener("click",()=>{
    selectedTopics.clear();topicMode="any";search.value="";
    $("atlas-topic-mode").value="any";
    for(const [key,el] of Object.entries(facetEls))
      el.value=key==="sort"?"recent":"all";
    refreshDependentOptions("all","all");
    updateFilters();search.focus();
  });
  // Mobile browsing prioritizes actual research records over seven detailed facets.
  const advanced=$("atlas-advanced");
  if(advanced&&window.matchMedia("(max-width:680px)").matches)advanced.open=false;
  fetch("./resources.json").then(async res=>{
    if(!res.ok)throw Error("Research catalog unavailable");
    const result=atlas.validate(await res.json());
    all=result.items;topics=result.topics;
    restoreAtlasURL();
  }).catch(error=>{
    if(count)count.textContent="Research catalog unavailable. Please consult the source links below.";
    if($("resource-fallback"))$("resource-fallback").hidden=false;
    console.error("Research Atlas initialization:",error);
  });

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
