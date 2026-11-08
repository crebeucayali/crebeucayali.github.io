const { chromium } = require("playwright");
const { strict: assert } = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--no-sandbox"] });
  const widths = [1440, 1280, 1100, 1024, 768, 390, 320];
  const results = [];
  fs.mkdirSync("test-results/eva-fase5", { recursive: true });
  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.route(/https:\/\/dteimbhwtzghhsijeeld\.supabase\.co\/rest\/v1\/.*/, async route => {
        const resource = new URL(route.request().url()).pathname.split("/").pop();
        const data = {
          repositorio_recursos: [{ id:21, titulo:"Libro de texturas", created_at:"2026-09-27T14:51:45+00:00" }],
          noticias_destacadas: [{ id:3, titulo:"Práctica Braille", descripcion:"Recurso accesible", categoria:"MEA", imagen_url:"", enlace_url:"https://crebeucayali.github.io/materiales-educativos-accesibles/", visible:true,estado_publicacion:"publicado",orden:1, created_at:"2026-09-27T14:51:45+00:00" }],
          calendario_publico: [{ registro_id:"test", fecha:"2099-11-12", contenido_lineas:["Sesión futura"], orden:1 }],
          eva_recursos_destacados: [],
          ra_materiales_semana_publicos: [],
          eva_indicadores_config: [],
          eva_indicadores_institucionales: [],
          eva_comunicados_emergentes: []
        };
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data[resource] || []) });
      });
      await page.route("https://crebeucayali.github.io/**", async route => {
        // Scripts externos no forman parte de las pruebas del layout aislado.
        await route.abort();
      });
      await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => {
        const layout=document.getElementById("eva-distribucion");
        const aside=document.getElementById("eva-columna-lateral");
        layout.classList.add("eva-layout-activo");
        aside.hidden=false;
        window.EvaColumnaLateral.iniciar();
      });
      await page.waitForFunction(() => document.querySelector("#eva-lateral-recursos li a") !== null, { timeout: 8000 });
      const result = await page.evaluate(() => {
        const get = selector => document.querySelector(selector).getBoundingClientRect();
        const main = get(".eva-columna-principal");
        const aside = get(".eva-columna-lateral");
        const hero = get(".hero");
        const search = get(".herramientas-eva");
        const cards=[...document.querySelectorAll(".tarjetas > a.tarjeta")];
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          cardCount:cards.length,
          lateralVisible:!document.getElementById("eva-columna-lateral").hidden,
          laterBeside:aside.left >= main.right-2,
          laterBelow:aside.top >= main.bottom-2,
          heroAbove:hero.bottom <= main.top + 2,
          searchAbove:search.bottom <= main.top + 2,
          mainWidth:Math.round(main.width),
          asideWidth:Math.round(aside.width),
          modulesInMain:cards.every(x=>document.querySelector(".eva-columna-principal").contains(x)),
          populated:["eva-lateral-recursos","eva-lateral-noticias","eva-lateral-agenda"].every(id=>document.getElementById(id).querySelector("a")),
          controls:["ra-semana-anterior","ra-semana-siguiente","ra-semana-pausa"].every(id=>document.getElementById(id)),
          newsControl:!!document.querySelector(".noticias-anterior")&&!!document.querySelector(".noticias-siguiente"),
          logoAndBanner:!!document.querySelector(".cabecera-crebe")&&!!document.querySelector(".hero .patron-portada")
        };
      });
      await page.screenshot({ path:path.join("test-results/eva-fase5",width+".png"), fullPage:true, animations:"disabled" });
      const expectedBeside=width>1050;
      assert.equal(result.cardCount,6,"6 módulos preservados");
      assert.equal(result.lateralVisible,true);
      assert.equal(result.modulesInMain,true);
      assert.equal(result.populated,true,"Bloques públicos alimentados");
      assert.equal(result.controls&&result.newsControl&&result.logoAndBanner,true);
      assert.ok(result.overflow<=2,"Desbordamiento horizontal: "+width+" -> "+result.overflow);
      assert.equal(result.laterBeside,expectedBeside,"Columna lateral según breakpoint "+width);
      if (!expectedBeside) assert.ok(result.laterBelow,"Columna apilada "+width);
      assert.ok(result.heroAbove&&result.searchAbove,"Hero y buscador conservados arriba");
      assert.equal(errors.length,0,"Errores JS "+errors.join(" | "));
      results.push({width,...result,errors});
      console.log("PASS",width,JSON.stringify(result));
      await page.close();
    }
    fs.writeFileSync("test-results/eva-fase5/results.json",JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
