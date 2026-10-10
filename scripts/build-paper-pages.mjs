// Run with: node scripts/build-paper-pages.mjs
// Deterministic static HTML generation from the curated v2 catalog; no network requests.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {resolve} from "node:path";
const root=process.cwd(),data=JSON.parse(readFileSync(resolve(root,"docs/resources.json"),"utf8"));
const papers=data.items.filter(x=>x.type==="paper");
const topicName=id=>data.topics.find(t=>t.id===id)?.label||id;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const good=s=>typeof s==="string"&&s.startsWith("https://");
function action(url,text,extra=""){return good(url)?`<a class="paper-button ${extra}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} <span aria-hidden="true">↗</span></a>`:"";}
function render(p){
 const url=`https://snncommunity.github.io/.github/papers/${p.id}/`;
 const aff=p.affiliations||[];
 const more=papers.filter(x=>x.id!==p.id).map(x=>({paper:x,weight:x.topics.filter(t=>p.topics.includes(t)).length})).filter(x=>x.weight).sort((a,b)=>b.weight-a.weight||a.paper.title.localeCompare(b.paper.title)).slice(0,3).map(({paper:x})=>`<a class="paper-related-link" href="../${esc(x.id)}/"><span>${esc(x.publication.venue)} · ${x.publication.year}</span><strong>${esc(x.title)}</strong><span>Shared tags: ${x.topics.filter(t=>p.topics.includes(t)).map(topicName).map(esc).join(" · ")}</span></a>`).join("\n");
 const affiliations=aff.length?`<ul class="paper-evidence-list">${aff.map(a=>`<li><strong>${esc(a.university)}</strong><span>${esc(a.country)}</span><a href="${esc(a.source)}" target="_blank" rel="noopener noreferrer">Published affiliation source ↗</a></li>`).join("\n")}</ul>`:`<p class="paper-muted">Author affiliations have not yet been independently transcribed and cross-checked for this record. No country is inferred.</p>`;
 const source=p.bibliographySource||p.url;
 const jsonld=JSON.stringify({"@context":"https://schema.org","@type":"ScholarlyArticle",headline:p.title,datePublished:String(p.publication.year),url:p.url,mainEntityOfPage:url,isPartOf:{"@type":"Periodical",name:p.publication.venue}}).replace(/</g,"\\u003c");
 return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#123c32">
<title>${esc(p.title)} · SNN Research Atlas</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../../styles.css">
<link rel="stylesheet" href="../../paper.css">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)} · SNN Research Atlas">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<script type="application/ld+json">${jsonld}</script>
</head>
<body class="paper-view">
<a class="skip-link" href="#main">Skip to paper record</a>
<header class="paper-nav"><div class="container paper-nav-inner"><a class="paper-brand" href="../../">SNN<span>/</span>COMMUNITY</a><nav aria-label="Research navigation"><a href="../../#library">← Research Atlas</a><a href="../../#lab">Neuron lab</a><a href="https://github.com/SNNCommunity/.github/issues/new/choose" target="_blank" rel="noopener noreferrer">Suggest a correction ↗</a></nav></div></header>
<main id="main">
<section class="paper-hero"><div class="container"><p class="paper-eyebrow">RESEARCH ATLAS <span aria-hidden="true">/</span> SCIENTIFIC RECORD</p>
<div class="paper-hero-main"><div><p class="paper-venue">${esc(p.publication.kind)} <span aria-hidden="true">·</span> ${esc(p.publication.venue)} <span aria-hidden="true">·</span> ${p.publication.year}</p>
<h1>${esc(p.title)}</h1>
<p class="paper-deck">${esc(p.description)}</p><div class="paper-tags">${p.topics.map(t=>`<span>${esc(topicName(t))}</span>`).join("")}</div>
<div class="paper-actions">${action(p.url,"View official paper","primary")}${action(p.code,"Visit linked code")}${p.doi?action("https://doi.org/"+p.doi,"DOI"):""}</div></div>
<aside class="paper-side"><p class="paper-aside-label">INDEX RECORD</p><strong>${esc(p.id)}</strong><hr><p>Publication: <b>Source-linked</b></p><p>Affiliation: <b>${aff.length?"Partially indexed":"Not verified"}</b></p><p>Reproduction: <b>Not independently reproduced</b></p><p class="paper-fine">Indexing a publication does not constitute endorsement or scientific verification.</p></aside></div></div></section>
<section class="paper-content"><div class="container paper-content-grid"><article class="paper-main">
<div class="paper-panel"><p class="paper-eyebrow">01 / RESEARCH SUMMARY</p><h2>What this record covers</h2><p>${esc(p.description)}</p><p class="paper-muted">This is an editorial catalog description, not the original paper abstract. Consult the publication for its complete claims, experiments and author list.</p></div>
<div class="paper-panel"><p class="paper-eyebrow">02 / PUBLISHED AFFILIATIONS</p><h2>Source-linked institutions</h2><p class="paper-muted">${aff.length?"The list below includes only currently indexed affiliations; it has not been certified as an exhaustive authorship-to-institution mapping.":"Unverified does not mean that the published work has no institutional affiliations."}</p>${affiliations}</div>
<div class="paper-panel"><p class="paper-eyebrow">03 / REPRODUCIBILITY</p><h2>Evidence status</h2><div class="paper-status"><span>Bibliography</span><strong>Publication source linked</strong></div><div class="paper-status"><span>Independent execution</span><strong>Not available in this atlas</strong></div><div class="paper-status"><span>Source-code link</span><strong>${p.code?"Indexed (execution not checked)":"Not indexed"}</strong></div><p class="paper-muted">No benchmark score, accuracy, energy estimate or hardware result has been independently reproduced by SNNCommunity for this record.</p></div>
<div class="paper-panel"><p class="paper-eyebrow">04 / ORIGINAL SOURCES</p><h2>Traceable references</h2><div class="paper-source-links">${action(source,"Official bibliography source")}${action(p.url,"Original publication")}${action(p.code,"Linked implementation")}${p.doi?action("https://doi.org/"+p.doi,"DOI resolver"):""}</div></div>
</article><aside class="paper-aside"><div class="paper-panel"><p class="paper-eyebrow">DISCOVER MORE</p><h2>Related by research tags</h2><p class="paper-muted">Catalog relationships are based on shared editorial topic labels, not empirical comparisons.</p><div class="paper-related">${more||"<p>No related indexed papers yet.</p>"}</div><a class="paper-back" href="../../#library">← Explore all research</a></div><div class="paper-panel paper-small"><p class="paper-eyebrow">IMPROVE THIS RECORD</p><p>Found a missing affiliation, broken link or version mismatch?</p><a class="paper-back" href="https://github.com/SNNCommunity/.github/issues/new/choose" target="_blank" rel="noopener noreferrer">Submit source-backed correction ↗</a></div></aside></div></section>
</main><footer class="paper-footer"><div class="container"><span>SNNCommunity · Open research directory</span><span>Curated, non-exhaustive, independently maintained</span></div></footer>
</body></html>\n`;
}
for(const p of papers){
 if(!/^[a-z0-9-]+$/.test(p.id))throw Error("Unsafe publication ID: "+p.id);
 const dir=resolve(root,"docs/papers",p.id);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,"index.html"),render(p));
}
const escapeXML=s=>String(s).replace(/[<>&"']/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"}[c]));
const urls=["https://snncommunity.github.io/.github/",...papers.map(p=>"https://snncommunity.github.io/.github/papers/"+p.id+"/")];
writeFileSync(resolve(root,"docs/sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(x=>`  <url><loc>${escapeXML(x)}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log("Generated",papers.length,"static, source-linked paper pages.");
