import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {chromium} from "playwright";

/* Regresión visual aislada: CTA de Lecturas inclusivas dentro de EVA principal. */
const raiz=new URL("../",import.meta.url);
const index=await readFile(new URL("index.html",raiz),"utf8");
const js=await readFile(new URL("eva-lecturas-inclusivas.js",raiz),"utf8");
const cssPaths=["eva-botones-body.css","eva-identidad-ac-ra.css","eva-lecturas-inclusivas.css"];
const css=await Promise.all(cssPaths.map(path=>readFile(new URL(path,raiz),"utf8")));
assert.ok(index.includes('href="eva-identidad-ac-ra.css?v=5"'),"CSS actualizado en portada");
assert.ok(cssPaths.every(path=>index.includes('href="'+path+'?v=')),"Hojas CSS de lectura presentes");
assert.ok(cssPaths.map(path=>index.indexOf('href="'+path+'?v=')).every((pos,i,a)=>i===0||pos>a[i-1]),"Orden correcto de hojas CSS");
assert.match(js,/contenido\("a", "eva-lectura-enlace", "Leer artículo completo"\)/,"El enlace se genera dinámicamente");
assert.match(js,/enlace\.href = nota\.url/,"No alterar el destino original");

const baseHTML=`<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${css.map(style=>"<style>"+style+"</style>").join("\n")}
</head><body><main id="eva-distribucion">
<section class="eva-lecturas-destacada" id="eva-lecturas-destacada">
<article class="eva-lectura-contenido"><a class="eva-lectura-enlace" id="lectura"
href="https://crebeucayali.github.io/accesos-complementarios/lecturas-inclusivas/articulos/ejemplo.html">Leer artículo completo</a></article>
</section>
<a class="ra-semana-boton" id="ra" href="https://crebeucayali.github.io/repositorio-accesible/">Ver recurso</a>
</main></body></html>`;
const rgb=(r,g,b)=>`rgb(${r}, ${g}, ${b})`;
const ciruela=rgb(130,59,99),ciruelaOscuro=rgb(104,44,78),blanco=rgb(255,255,255),negro=rgb(0,0,0);
const browser=await chromium.launch({headless:true});
try {
 for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:780},reducedMotion:"reduce"});
   await page.setContent(baseHTML);
   const anchor=page.locator("#lectura");
   const color=async()=>page.evaluate(()=>{
     const el=document.querySelector("#lectura"),style=getComputedStyle(el),arrow=getComputedStyle(el,"::after"),ra=getComputedStyle(document.querySelector("#ra"));
     return {background:style.backgroundColor,color:style.color,border:style.borderTopColor,
       radius:style.borderTopLeftRadius,display:style.display,height:el.getBoundingClientRect().height,
       arrow:arrow.content,arrowBorder:arrow.borderTopStyle,otherColor:ra.color,
       otherBackground:ra.backgroundColor,href:el.href,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   let value=await color();
   assert.equal(value.color,ciruela,`Texto ciruela en estado normal ${width}`);
   assert.equal(value.border,ciruela,`Borde ciruela en estado normal ${width}`);
   assert.equal(value.background,"rgba(0, 0, 0, 0)",`Sin relleno en reposo ${width}`);
   assert.equal(value.radius,"2px",`Esquinas como botones EVA ${width}`);
   assert.equal(value.display,"inline-flex",`Diseño común de botones EVA ${width}`);
   assert.ok(value.height>=40,`Altura accesible ${width}`);
   assert.equal(value.arrow,'"›"',`Flecha circular ${width}`);
   assert.equal(value.arrowBorder,"solid",`Contorno circular de flecha ${width}`);
   assert.equal(value.otherColor,rgb(23,63,108),`Color existente del botón RA intacto ${width}`);
   assert.equal(value.otherBackground,"rgba(0, 0, 0, 0)",`Botón RA sin relleno ${width}`);
   assert.match(value.href,/lecturas-inclusivas\/articulos\/ejemplo\.html$/);
   assert.equal(value.overflow,false,`Sin desbordamiento horizontal ${width}`);

   await anchor.hover();
   value=await color();
   assert.equal(value.background,ciruelaOscuro,`Relleno al hover ${width}`);
   assert.equal(value.color,blanco,`Texto blanco al hover ${width}`);
   await page.mouse.move(0,0);
   await anchor.focus();
   value=await color();
   assert.equal(value.background,ciruelaOscuro,`Relleno al enfocar ${width}`);
   assert.equal(value.color,blanco,`Contraste en foco ${width}`);

   await anchor.blur();
   await page.evaluate(()=>document.body.classList.add("alto-contraste"));
   value=await color();
   assert.equal(value.background,negro,`Fondo contraste alto ${width}`);
   assert.equal(value.color,blanco,`Texto contraste alto ${width}`);
   assert.equal(value.border,blanco,`Borde contraste alto ${width}`);
   await page.close();
 }
 console.log("4 resoluciones aprobadas. CTA AC: contorno, flecha, hover, foco, alto contraste, RA intacto y destino conservado.");
}finally {await browser.close();}
