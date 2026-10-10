// SNN Research Atlas deterministic clean build. Run from repository root.
import {readFileSync,writeFileSync,mkdirSync,rmSync} from "node:fs";
import {resolve} from "node:path";
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const action=(url,label,cls="")=>typeof url==="string"&&url.startsWith("https://")?`<a class="paper-button ${cls}" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} ↗</a>`:"";
const render=function render(p,papers,topics){
 const esc=escapeHTML,authors=(p.authorships||[]).map(a=>a.name);
 const base="https://snncommunity.github.io/.github/papers/"+p.id+"/";
 const correction="https://github.com/SNNCommunity/.github/issues/new?title="+encodeURIComponent("[Atlas metadata] "+p.id)+"&body="+encodeURIComponent("Record: "+base+"\nPlease include official supporting sources.\n");
 const affs=p.affiliations||[];
 const rel=papers.filter(x=>x.id!==p.id).map(x=>({x,common:x.topics.filter(t=>p.topics.includes(t))}))
   .filter(x=>x.common.length).sort((a,b)=>b.common.length-a.common.length||a.x.title.localeCompare(b.x.title)).slice(0,3);
 const label=id=>topics.find(t=>t.id===id)?.label||id;
 const linked=action(p.researchContentSource||p.bibliographySource,"Verify with publication");
 const notes=p.researchMethod||p.researchQuestion||p.evaluationScope?
   `<div class="research-notes">
   <p class="paper-muted">Editorial synthesis from the original publication. These descriptions are not the verbatim abstract, or independent reproduction.</p>
   ${p.researchQuestion?`<h3>Question</h3><p>${esc(p.researchQuestion)}</p>`:""}
   ${p.researchMethod?`<h3>Method</h3><p>${esc(p.researchMethod)}</p>`:""}
   ${p.evaluationScope?`<h3>Evaluation described by the authors</h3><p>${esc(p.evaluationScope)}</p>`:""}
   ${linked}</div>`:
   `<p class="paper-muted">A detailed methodological synopsis has not been verified for this record. Read the original publication for its full method, assumptions and experiments.</p>${action(p.url,"Read original publication")}`;
 const sourceAff=affs.length?`<ul class="paper-evidence-list">${affs.map(a=>`<li><strong>${esc(a.university)}</strong><span>${esc(a.country)}</span><a href="${esc(a.source)}" target="_blank" rel="noopener noreferrer">Original affiliation source ↗</a></li>`).join("")}</ul>`:
 `<p class="paper-muted">Institutions have not been independently transcribed for this record. No country is inferred.</p>`;
 const related=rel.map(y=>`<a class="paper-related-link" href="../${esc(y.x.id)}/"><span>${esc(y.x.publication.venue)} · ${y.x.publication.year}</span><strong>${esc(y.x.title)}</strong><span>${y.common.map(label).map(esc).join(" · ")}</span></a>`).join("");
 const structured={"@context":"https://schema.org","@type":"ScholarlyArticle",headline:p.title,url:p.url,
   datePublished:String(p.publication.year),mainEntityOfPage:base,isPartOf:{"@type":"CreativeWork",name:p.publication.venue}};
 if(authors.length)structured.author=authors.map(name=>({"@type":"Person",name}));
 if(p.doi)structured.identifier={"@type":"PropertyValue",propertyID:"DOI",value:p.doi};
 const json=JSON.stringify(structured).replace(/</g,"\\u003c");
 return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#103a31"><title>${esc(p.title)} · SNN Research Atlas</title>
<meta name="description" content="${esc(p.description)}"><link rel="canonical" href="${base}">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../../styles.css"><link rel="stylesheet" href="../../paper.css">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(p.title)} · SNN Research Atlas">
<meta property="og:description" content="${esc(p.description)}"><meta property="og:url" content="${base}">
<script type="application/ld+json">${json}</script></head>
<body class="paper-view"><a class="skip-link" href="#main">Skip to research record</a>
<header class="paper-nav"><div class="container paper-nav-inner"><a class="paper-brand" href="../../">SNN<span>/</span>COMMUNITY</a>
<nav aria-label="Research navigation"><a href="../../#library">← Research Atlas</a><a href="../../#lab">Neuron lab</a><a href="${esc(correction)}" target="_blank" rel="noopener noreferrer">Correct this record ↗</a></nav></div></header>
<main id="main">
<section class="paper-hero"><div class="container"><p class="paper-eyebrow">RESEARCH ATLAS / SCIENTIFIC RECORD</p>
<div class="paper-hero-main"><div><p class="paper-venue">${esc(p.publication.kind)} · ${esc(p.publication.venue)} · ${p.publication.year}</p>
<h1>${esc(p.title)}</h1>
<p class="paper-authors">${authors.length?authors.map(esc).join(", ")+" "+action(p.authorshipSource,"Author source"):"Author list pending source verification."}</p>
<p class="paper-deck">${esc(p.description)}</p>
<div class="paper-tags">${p.topics.map(t=>`<span>${esc(label(t))}</span>`).join("")}</div>
<div class="paper-actions">${action(p.url,"Original paper","primary")}${action(p.code,"Linked code")}${p.doi?action("https://doi.org/"+p.doi,"DOI"):""}</div></div>
<aside class="paper-side"><p class="paper-aside-label">SOURCE COVERAGE</p>
<p><strong>Publication</strong><span>Primary reference linked</span></p>
<p><strong>Authors</strong><span>${authors.length?"Names transcribed":"Pending review"}</span></p>
<p><strong>Affiliations</strong><span>${affs.length?"Partial index":"Unverified"}</span></p>
<p><strong>Reproduction</strong><span>Not independently reproduced</span></p>
<p class="paper-fine">Indexing does not certify scientific results.</p></aside></div></div></section>
<section class="paper-content"><div class="container paper-content-grid"><article class="paper-main">
<section class="paper-panel" id="research"><p class="paper-eyebrow">01 / SCIENTIFIC ORIENTATION</p><h2>Research question and method</h2>${notes}</section>
<section class="paper-panel" id="affiliations"><p class="paper-eyebrow">02 / AUTHOR AFFILIATIONS</p><h2>Source-linked institutions</h2>
<p class="paper-muted">This list is not a complete author-to-institution audit.</p>${sourceAff}</section>
<section class="paper-panel" id="evidence"><p class="paper-eyebrow">03 / EVIDENCE STATUS</p><h2>What is documented?</h2>
<div class="paper-status"><span>Publication</span><strong>Source linked, not full audit</strong></div>
<div class="paper-status"><span>Authors</span><strong>${authors.length?"Names transcribed from linked record":"Unverified"}</strong></div>
<div class="paper-status"><span>Institution coverage</span><strong>${affs.length?"Partial":"Unverified"}</strong></div>
<div class="paper-status"><span>Independent reproduction</span><strong>Not independently reproduced</strong></div>
<p class="paper-muted">Any experimental performance statements are author-reported. No SNNCommunity task-level benchmark or energy study is implied.</p></section>
<section class="paper-panel" id="sources"><p class="paper-eyebrow">04 / ORIGINAL SOURCES</p><h2>Publication &amp; implementation</h2><div class="paper-source-links">
${action(p.bibliographySource,"Bibliography")}${action(p.url,"Original paper")}${action(p.authorshipSource,"Author listing")}${action(p.code,"Linked source code")}${p.doi?action("https://doi.org/"+p.doi,"DOI resolver"):""}</div></section></article>
<aside class="paper-aside"><div class="paper-panel"><p class="paper-eyebrow">RELATED CATALOG WORK</p><h2>Shared research areas</h2>
<p class="paper-muted">Taxonomy overlap, not a verified method-citation relationship.</p><div class="paper-related">${related||"<p>No related indexed papers.</p>"}</div>
<a class="paper-back" href="../../#library">← Browse all research</a></div>
<div class="paper-panel paper-small"><p class="paper-eyebrow">IMPROVE THIS RECORD</p><p>Correct metadata or propose better scientific notes with a citable source.</p>
<a class="paper-back" href="${esc(correction)}" target="_blank" rel="noopener noreferrer">Submit correction ↗</a></div></aside></div></section>
</main><footer class="paper-footer"><div class="container"><span>SNNCommunity · Research Atlas</span><span>Curated, non-exhaustive, independent</span></div></footer>
</body></html>\n`;
};
function polishRecord(html){
 return html.replace(/<aside class="paper-side">[\s\S]*?<\/aside>/,"")
 .replace('<section class="paper-content">',`<nav class="paper-jump-nav" aria-label="Research record sections"><div class="container">
<a href="#research">Method &amp; evaluation</a><a href="#sources">Original sources</a><a href="#affiliations">Institutions</a><a href="#evidence">Evidence status</a></div></nav>
<section class="paper-content">`);
}
const xmlEsc=s=>String(s).replace(/[<>&"']/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"}[c]));
const root=process.cwd(),data=JSON.parse(readFileSync(resolve(root,"docs/resources.json"),"utf8"));
const papers=data.items.filter(x=>x.type==="paper");
const out=resolve(root,"docs/papers");rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for(const item of papers){
 if(!/^[a-z0-9-]+$/.test(item.id))throw Error("Unsafe publication id");
 const folder=resolve(out,item.id);mkdirSync(folder,{recursive:true});
 writeFileSync(resolve(folder,"index.html"),polishRecord(render(item,papers,data.topics)));
}
const urls=["https://snncommunity.github.io/.github/",...papers.map(p=>"https://snncommunity.github.io/.github/papers/"+p.id+"/")];
writeFileSync(resolve(root,"docs/sitemap.xml"),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>"  <url><loc>"+xmlEsc(u)+"</loc></url>").join("\n")+'\n</urlset>\n');
console.log("Generated",papers.length,"paper pages; removed stale pages.");
