import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css=readFileSync(new URL("../docs/styles.css",import.meta.url),"utf8");
const hexLum=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const [x,y]=[hexLum(a),hexLum(b)].sort((x,y)=>x-y);return(y+.05)/(x+.05);};
test("operational text color pairs exceed WCAG AA normal text contrast",()=>{
 for(const [foreground,background,label] of [
  ["#526b60","#f0f4ef","form helper on light panel"],
  ["#526b60","#ffffff","resource detail on white"],
  ["#62736b","#ffffff","resource descriptions"],
  ["#b2c8c3","#101d23","footer text on navy"]]){
  assert.ok(ratio(foreground,background)>=4.5,label+": "+ratio(foreground,background));
 }
});
test("type tokens and readability sizing are present",()=>{
 assert.match(css,/--type-body:\s*1rem/);
 assert.match(css,/--type-ui:\s*\.875rem/);
 assert.match(css,/--reading-measure:\s*68ch/);
 assert.match(css,/\.resource-card p \{[^}]*font-size:\s*15px/);
 assert.match(css,/\.control-field label \{[^}]*font-size:\s*14px/);
 assert.match(css,/\.model-note \{[^}]*font-size:\s*13px/);
 assert.match(css,/\.lab-actions \.button \{[^}]*font-size:\s*14px/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
});
