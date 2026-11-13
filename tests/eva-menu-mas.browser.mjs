import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {chromium} from "playwright";

const root=new URL("../",import.meta.url);
const html=await readFile(new URL("index.html",root),"utf8");
const layout=await readFile(new URL("estilos.css",root),"utf8");
const menuCSS=await readFile(new URL("eva-menu-responsive.css",root),"utf8");
const menuJS=await readFile(new URL("eva-menu-responsive.js",root),"utf8");
assert.match(html,/eva-menu-responsive\.css\?v=7/);
assert.match(html,/eva-menu-responsive\.js\?v=2/);
const section=html.slice(html.indexOf('<header class="cabecera-crebe">'),html.indexOf('<main class="portal-crebe">'));
assert.ok(section.includes("eva-menu-identidad")&&section.includes("eva-mas-panel"));
assert.equal((section.match(/id="admin-toggle"/g)||[]).length,1);
const expected=[
 ["Directorio","/directorios/directorio-institucional.html"],
 ["Entidades","/directorios/directorio-ciudadano.html"],
 ["Calendarios CREBE","/recursos/calendarios.html"],
 ["Galería","/recursos/galeria.html"],
 ["Lecturas inclusivas","/lecturas-inclusivas/"],
 ["Guía de uso","/paginas/guia-de-uso.html"],
 ["Mapa web","/paginas/mapa-web.html"]
];
const pageHTML=`<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${layout}</style><style>${menuCSS}</style></head>
<body class="theme-crebe"><div id="app">${section}</div><main>Contenido informativo</main></body></html>`;
const browser=await chromium.launch({headless:true});
try{
 for(const width of [320,390,768,1024,1280,1440]){
   const mobile=width<=1050;
   const page=await browser.newPage({viewport:{width,height:850},reducedMotion:"reduce"});
   await page.setContent(pageHTML);
   await page.addScriptTag({content:menuJS});
   assert.equal(await page.locator("#eva-mas-toggle").count(),1);
   assert.equal(await page.locator("#eva-menu-fondo").isHidden(),true);
   assert.equal(await page.locator("#eva-mas-panel").isHidden(),true);
   const moreLinks=await page.locator("#eva-mas-panel a").evaluateAll(nodes=>nodes.map(n=>({title:n.textContent.trim(),path:new URL(n.href).pathname})));
   assert.deepEqual(moreLinks,expected.map(([title,path])=>({title,path:"/accesos-complementarios"+path})));
   assert.equal(await page.locator("#admin-toggle").count(),1);
   if(mobile){
     await page.locator("#eva-menu-toggle").click();
     assert.equal(await page.locator("#eva-nav-principal").isVisible(),true);
     assert.equal(await page.locator("#eva-menu-toggle").getAttribute("aria-expanded"),"true");
     assert.equal(await page.locator("#eva-menu-fondo").isVisible(),true);
     const rect=await page.locator("#eva-nav-principal").boundingBox();
     assert.ok(rect.x>=width-rect.width-2,"Cajón a la derecha "+width);
     assert.ok(rect.width<=width*.91,"Cajón no ocupa todo el ancho "+width);
     assert.equal(await page.locator(".eva-menu-identidad strong").innerText(),"EVA 2.0");
     assert.equal(await page.locator(".eva-menu-identidad img").getAttribute("alt"),"Logo institucional del CREBE");
     await page.locator("#eva-mas-toggle").click();
     assert.equal(await page.locator("#eva-mas-panel").isVisible(),true);
     assert.equal(await page.locator("#eva-mas-toggle").getAttribute("aria-expanded"),"true");
     assert.equal(await page.locator(".eva-mas-identidad").isVisible(),false);
     await page.locator("#eva-mas-toggle").click();
     assert.equal(await page.locator("#eva-mas-panel").isHidden(),true);
     await page.locator("#eva-mas-toggle").click();
     await page.keyboard.press("Escape");
     assert.equal(await page.locator("#eva-nav-principal").isVisible(),false);
     assert.equal(await page.locator("#eva-menu-fondo").isHidden(),true);
     await page.locator("#eva-menu-toggle").click();
     await page.locator("#eva-menu-cerrar").click();
     assert.equal(await page.locator("#eva-nav-principal").isVisible(),false);
   }else{
     await page.locator("#eva-mas-toggle").click();
     assert.equal(await page.locator("#eva-mas-panel").isVisible(),true);
     assert.equal(await page.locator(".eva-mas-identidad strong").innerText(),"EVA 2.0");
     const rect=await page.locator("#eva-mas-panel").boundingBox();
     assert.ok(rect.x>=width-rect.width-2,"Panel Más a la derecha "+width);
     assert.equal(await page.locator("#eva-menu-fondo").isVisible(),true);
     await page.keyboard.press("Escape");
     assert.equal(await page.locator("#eva-mas-panel").isHidden(),true);
     await page.locator("#eva-mas-toggle").click();
     await page.locator("#eva-mas-cerrar").click();
     assert.equal(await page.locator("#eva-mas-panel").isHidden(),true);
   }
   await page.locator("#eva-mas-toggle").evaluate(el=>el.focus());
   assert.equal(await page.locator("#eva-mas-toggle").getAttribute("aria-controls"),"eva-mas-panel");
   const overflow=await page.evaluate(()=>({
     width:innerWidth,scroll:document.documentElement.scrollWidth,
     elements:[...document.querySelectorAll("body *")].map(el=>{
       const r=el.getBoundingClientRect();
       return {selector:el.id||el.className||el.tagName,right:Math.round(r.right),left:Math.round(r.left),width:Math.round(r.width)};
     }).filter(x=>x.right>innerWidth+2||x.left< -2).slice(0,12)
   }));
   assert.ok(overflow.scroll<=overflow.width+2,"Sin desplazamiento horizontal "+width+": "+JSON.stringify(overflow));
   await page.close();
 }
 const contrast=await browser.newPage({viewport:{width:390,height:780}});
 await contrast.setContent(pageHTML);
 await contrast.addScriptTag({content:menuJS});
 await contrast.evaluate(()=>document.body.classList.add("alto-contraste"));
 await contrast.locator("#eva-menu-toggle").click();
 const bg=await contrast.locator("#eva-nav-principal").evaluate(n=>getComputedStyle(n).backgroundColor);
 assert.equal(bg,"rgb(0, 0, 0)","Fondo de alto contraste en menú");
 await contrast.close();
 console.log("6 resoluciones aprobadas, 7 enlaces, cajón derecho, Más, Escape, cierre, sesión independiente y contraste.");
}finally{await browser.close();}
