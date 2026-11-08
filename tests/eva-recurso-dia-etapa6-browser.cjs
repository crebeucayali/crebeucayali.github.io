const {chromium}=require("playwright");
const {strict:assert}=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");
const TODAY=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const y=(x)=>{const [a,b,c]=x.split("-").map(Number);return new Date(Date.UTC(a,b-1,c-1)).toISOString().slice(0,10)};
const row=(date,label)=>({fecha:date,tipo:"arasaac",arasaac_ids:[12345,67890],
 titulo:label,descripcion:"Orientación educativa accesible, revisada y aprobada.",
 texto_alternativo:"Dos pictogramas educativos que representan el concepto",
 fuente_url:"https://arasaac.org/",licencia:"CC BY-NC-SA 4.0",
 atribucion:"Pictogramas: Sergio Palao. Procedencia: ARASAAC. Propiedad: Gobierno de Aragón. Licencia CC BY-NC-SA 4.0. IDs: 12345, 67890."});
(async()=>{
 const browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox"]});
 fs.mkdirSync("test-results/recurso-dia-06",{recursive:true});
 try {
  for(const scenario of ["programado","vacio","solo-ayer"]){
   for(const width of [1440,1280,1100,1024,768,390,320]){
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.route("https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/**",route=>{
     const name=new URL(route.request().url()).pathname.split("/").at(-1);
     const data=name==="eva_recurso_dia_publico"
       ?(scenario==="programado"?[row(TODAY,"Recurso del día de prueba")]:[])
       :name==="eva_recurso_ayer_publico"
         ?(scenario==="vacio"?[]:[row(y(TODAY),"Recurso de ayer de prueba")])
         :[];
     return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
    });
    await page.route("https://static.arasaac.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5n8AAAAASUVORK5CYII=","base64")}));
    await page.route("https://crebeucayali.github.io/**",route=>route.abort());
    await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>window.EvaRecursoDiaPublico!==undefined,{timeout:10000});
    await page.evaluate(()=>window.EvaRecursoDiaPublico.actualizar());
    const present=scenario==="programado";
    const past=scenario!=="vacio";
    assert.equal(await page.locator("#eva-recurso-hoy").isVisible(),present,scenario+" hoy "+width);
    assert.equal(await page.locator("#eva-recurso-ayer").isVisible(),past,scenario+" ayer "+width);
    assert.equal(await page.locator("#eva-recurso-hoy").count(),1);
    assert.equal(await page.locator("#eva-recurso-ayer").count(),1);
    if(present){
      assert.equal(await page.locator("#eva-recurso-hoy img").count(),2);
      assert.equal(await page.locator("#eva-recurso-hoy img").first().getAttribute("alt"),"Dos pictogramas educativos que representan el concepto");
      assert.ok((await page.locator("#eva-recurso-hoy .eva-recurso-dia-creditos").innerText()).includes("Sergio Palao"));
      assert.equal(await page.locator("#eva-recurso-hoy .eva-recurso-dia-enlaces a").count(),3);
      assert.equal(await page.locator("#eva-recurso-hoy .eva-recurso-dia-nombre").innerText(),"Recurso del día de prueba");
    }
    if(past){
      assert.equal(await page.locator("#eva-recurso-ayer img").count(),2);
      assert.equal(await page.locator("#eva-recurso-ayer .eva-recurso-dia-nombre").innerText(),"Recurso de ayer de prueba");
      assert.equal(await page.locator("#eva-recurso-ayer .eva-recurso-dia-enlaces a").count(),3);
    }
    const positions=await page.evaluate(()=>{
      const rect=id=>document.querySelector(id).getBoundingClientRect();
      return {width:document.documentElement.scrollWidth-innerWidth,
        modules:rect(".eva-columna-principal > .tarjetas"),
        today:rect("#eva-recurso-hoy"),aside:rect("#eva-columna-lateral"),
        yesterday:rect("#eva-recurso-ayer"),
        main:rect(".eva-columna-principal"),
        sticky:getComputedStyle(document.querySelector("#eva-columna-lateral")).position,
        asideOverflow:getComputedStyle(document.querySelector("#eva-columna-lateral")).overflowY};
    });
    assert.ok(positions.width<=1,"Desbordamiento "+scenario+" "+width+" "+positions.width);
    if(width>1050){
      assert.ok(positions.aside.left>=positions.main.right-2,"Columnas paralelas "+width);
      assert.equal(positions.sticky,"sticky");
      assert.equal(positions.asideOverflow,"visible","Sin scroll lateral propio");
    }
    if(width<=700){
      if(present)assert.ok(positions.today.top>=positions.modules.bottom-2&&positions.aside.top>=positions.today.bottom-2,"Orden móvil hoy antes de lateral");
      else assert.ok(positions.aside.top>=positions.modules.bottom-2,"Móvil lateral tras seis módulos");
    }
    assert.equal(errors.length,0,errors.join(" | "));
    if(scenario==="programado")await page.screenshot({path:path.join("test-results/recurso-dia-06",width+".png"),fullPage:true,animations:"disabled"});
    console.log("PASS",scenario,width,{overflow:positions.width,sticky:positions.sticky});
    await page.close();
   }
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});