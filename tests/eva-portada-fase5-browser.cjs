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
          noticias_destacadas: [1,2,3].map(i=>({id:i,titulo:"Práctica Braille "+i,descripcion:"Recurso accesible",categoria:"MEA",imagen_url:"",enlace_url:"https://crebeucayali.github.io/materiales-educativos-accesibles/",visible:true,estado_publicacion:"publicado",orden:i,created_at:"2026-09-27T14:51:45+00:00"})),
          calendario_publico: [{ registro_id:"test", fecha:"2099-11-12", contenido_lineas:["Sesión futura"], orden:1 }],
          eva_recursos_destacados: [],
          ra_materiales_semana_publicos: [{programacion_id:15,etiqueta:"semana",titulo_1:"Amplificador de imagen",descripcion_1:"Recurso 1",imagen_1:"assets/imagenes/equipos-tecnologicos/amplificador-de-imagen.webp",alt_1:"Amplificador",titulo_2:"Máquina Perkins",descripcion_2:"Recurso 2",imagen_2:"assets/imagenes/equipos-tecnologicos/maquina-perkins.webp",alt_2:"Perkins",titulo_3:"Mis rutinas",descripcion_3:"Recurso 3",imagen_3:"assets/imagenes/materiales-elaborados/mis-rutinas.webp",alt_3:"Mis rutinas"}],
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
      // Validar activación automática: no introducir clases ni retirar hidden artificialmente.
      await page.waitForFunction(() => document.getElementById("eva-distribucion")?.classList.contains("eva-layout-activo")
        && !document.getElementById("eva-columna-lateral")?.hidden, { timeout: 8000 });
      await page.waitForFunction(() => document.querySelector("#eva-lateral-recursos li a") !== null, { timeout: 8000 });
      await page.waitForFunction(() => document.querySelectorAll("#ra-semana-visor .ra-semana-slide").length===3 && document.querySelectorAll("#noticias-pista .noticia-tarjeta").length===3, {timeout:8000});
      const beforeRA = await page.locator("#ra-semana-contador").innerText();
      await page.locator("#ra-semana-siguiente").click();
      const afterRA = await page.locator("#ra-semana-contador").innerText();
      assert.notEqual(beforeRA, afterRA, "Botón Siguiente del carrusel RA funcional");
      assert.ok((await page.locator("#ra-semana-pausa").innerText()).includes("Reanudar"),"Navegación manual pausa RA");
      await page.locator("#ra-semana-pausa").click();
      assert.ok((await page.locator("#ra-semana-pausa").innerText()).includes("Pausar"),"Reanudar RA funciona");
      await page.locator(".noticias-siguiente").click();
      assert.equal(await page.locator(".noticias-indicador[aria-pressed='true']").count(),1,"Indicador de noticia activa");
      await page.locator("#eva-lateral-recursos a").first().focus();
      assert.equal(await page.evaluate(()=>document.activeElement.closest("#eva-columna-lateral")!==null),true,"Foco accesible en columna lateral");
      await page.evaluate(()=>document.body.classList.add("alto-contraste"));
      const highContrast=await page.locator(".eva-lateral-bloque").first().evaluate(el=>getComputedStyle(el).backgroundColor);
      assert.equal(highContrast,"rgb(0, 0, 0)","Alto contraste en columna lateral");
      await page.evaluate(()=>document.body.classList.remove("alto-contraste"));
      const result = await page.evaluate(() => {
        const get = selector => document.querySelector(selector).getBoundingClientRect();
        const main = get(".eva-columna-principal");
        const aside = get(".eva-columna-lateral");
        const modules = get(".eva-columna-principal > .tarjetas");
        const resources = get("#ra-semana-eva");
        const hero = get(".hero");
        const search = get(".herramientas-eva");
        const cards=[...document.querySelectorAll(".tarjetas > a.tarjeta")];
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          cardCount:cards.length,
          lateralVisible:!document.getElementById("eva-columna-lateral").hidden,
          laterBeside:aside.left >= main.right-2,
          laterBelow:aside.top >= main.bottom-2,
          afterModules:aside.top >= modules.bottom-2,
          beforeResources:aside.bottom <= resources.top+2,
          heroAbove:hero.bottom <= modules.top + 2,
          searchAbove:search.bottom <= modules.top + 2,
          moduleBottom: Math.round(modules.bottom),
          asideTop: Math.round(aside.top),
          asideBottom: Math.round(aside.bottom),
          resourcesTop: Math.round(resources.top),
          mainWidth:Math.round(main.width),
          asideWidth:Math.round(aside.width),
          modulesInMain:cards.every(x=>document.querySelector(".eva-columna-principal").contains(x)),
          populated:["eva-lateral-recursos","eva-lateral-noticias","eva-lateral-agenda"].every(id=>document.getElementById(id).querySelector("a")),
          controls:["ra-semana-anterior","ra-semana-siguiente","ra-semana-pausa"].every(id=>document.getElementById(id)),
          newsControl:!!document.querySelector(".noticias-anterior")&&!!document.querySelector(".noticias-siguiente"),
          logoAndBanner:!!document.querySelector(".cabecera-crebe")&&!!document.querySelector(".hero .patron-portada")
        };
      });
      if (width > 1050) {
        const sticky = await page.evaluate(() => {
          const aside = document.getElementById("eva-columna-lateral");
          const style = getComputedStyle(aside);
          const maxScroll = document.documentElement.scrollHeight - innerHeight;
          scrollTo(0, Math.min(1000, Math.max(0, maxScroll - 150)));
          return new Promise(resolve => requestAnimationFrame(() => {
            const top = aside.getBoundingClientRect().top;
            const grid = document.getElementById("eva-distribucion").getBoundingClientRect();
            const ancestor = aside.parentElement?.parentElement?.getBoundingClientRect();
            const metrics = { position:style.position, overflowY:style.overflowY, top, height:aside.clientHeight, scrollHeight:aside.scrollHeight, scrollY:window.scrollY, gridTop:grid.top, gridBottom:grid.bottom, gridHeight:grid.height, ancestorBottom:ancestor?.bottom };
            aside.scrollTop = 120;
            requestAnimationFrame(() => resolve({ ...metrics, innerScrolled:aside.scrollTop }));
          }));
        });
        console.log("STICKY DIAGNOSTICO",width,JSON.stringify(sticky));
        assert.equal(sticky.position,"sticky","Actualidad lateral debe permanecer fija al desplazar en escritorio");
        assert.equal(sticky.overflowY,"auto","Actualidad lateral debe permitir scroll interno");
        assert.ok(Math.abs(sticky.top - 76)<=3,"Top sticky sin invadir cabecera: "+sticky.top);
        assert.ok(sticky.height<=900-90,"Sidebar no excede altura útil del viewport");
        if (sticky.scrollHeight>sticky.height) assert.ok(sticky.innerScrolled>0,"Scroll de sidebar accesible");
        console.log("STICKY PASS",width,JSON.stringify(sticky));
        await page.evaluate(() => window.scrollTo(0,0));
      }
      await page.screenshot({ path:path.join("test-results/eva-fase5",width+".png"), fullPage:true, animations:"disabled" });
      const expectedBeside=width>1050;
      assert.equal(result.cardCount,6,"6 módulos preservados");
      assert.equal(result.lateralVisible,true);
      assert.equal(result.modulesInMain,true);
      assert.equal(result.populated,true,"Bloques públicos alimentados");
      assert.equal(result.controls&&result.newsControl&&result.logoAndBanner,true);
      assert.ok(result.overflow<=2,"Desbordamiento horizontal: "+width+" -> "+result.overflow);
      if (width>700) assert.equal(result.laterBeside,expectedBeside,"Columna lateral según breakpoint "+width);
      if (width<=700) {
        assert.ok(result.afterModules && result.beforeResources,"Actualidad debe aparecer después de los módulos y antes de recursos "+width);
      } else if (!expectedBeside) {
        assert.ok(result.laterBelow,"Columna apilada "+width);
      }
      assert.ok(result.heroAbove&&result.searchAbove,"Hero y buscador conservados arriba");
      assert.equal(errors.length,0,"Errores JS "+errors.join(" | "));
      results.push({width,...result,errors});
      console.log("PASS",width,JSON.stringify(result));
      await page.close();
    }
    fs.writeFileSync("test-results/eva-fase5/results.json",JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
