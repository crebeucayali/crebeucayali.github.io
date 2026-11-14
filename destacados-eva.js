(() => {
  "use strict";
  const seccion=document.getElementById("recursos-destacados-eva");
  const contenedor=document.getElementById("recursos-destacados-grid");
  if(!seccion||!contenedor)return;
  const api="https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/eva_recursos_destacados";
  const publicKey="sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const origenes={
    "CAP":"/capacitaciones/",
    "BDA":"/banco-digital-accesible/",
    "MEA":"/materiales-educativos-accesibles/",
    "NI":"/accesos-complementarios/lecturas-inclusivas/",
    "RA":"/banco-digital-accesible/repositorio-accesible/",
    "DUA 3.0":"/DUA-3.0/"
  };
  function enlaceValido(valor,prefijo){
    try{
      const url=new URL(valor);
      return url.protocol==="https:"&&url.hostname==="crebeucayali.github.io"&&
        url.pathname.startsWith(prefijo)&&!url.username&&!url.password?url.href:null;
    }catch{return null;}
  }
  // Etapa 4: imágenes de GitHub CREBE y de la carpeta exclusiva de destacados.
  // No se aceptan otras carpetas de Storage ni direcciones externas.
  function imagenValida(valor){
    if(!valor||typeof valor!=="string")return null;
    try{
      const url=new URL(valor);
      if(url.protocol!=="https:"||url.username||url.password)return null;
      // Mantener las imágenes históricas de GitHub, incluidas sus versiones en URL.
      if(url.hostname==="crebeucayali.github.io"&&
        /\.(png|jpe?g|webp|gif|avif)$/i.test(url.pathname))return url.href;
      const prefijo="/storage/v1/object/public/eva-publico/destacados/";
      if(url.hostname==="dteimbhwtzghhsijeeld.supabase.co"&&
        !url.port&&!url.search&&!url.hash&&url.pathname.startsWith(prefijo)&&
        /^[A-Za-z0-9_-]+\.(webp|jpe?g|png)$/.test(url.pathname.slice(prefijo.length))){
        return url.href;
      }
      return null;
    }catch{return null;}
  }
  function tarjeta(recurso){
    const modulo=String(recurso.modulo||"");
    const prefijo=origenes[modulo];
    const href=prefijo&&enlaceValido(recurso.enlace_url,prefijo);
    if(!href||!String(recurso.titulo||"").trim()||!String(recurso.descripcion||"").trim())return null;
    const articulo=document.createElement("article");articulo.className="recurso-destacado-eva";articulo.dataset.modulo=modulo;
    const img=imagenValida(recurso.imagen_url);
    if(img){
      // Mismo patrón visual de los módulos principales: fotografía con capa
      // cromática y signo decorativo. El enlace de la tarjeta se mantiene único.
      const visual=document.createElement("div");
      visual.className="recurso-destacado-eva-visual";
      const imagen=document.createElement("img");
      imagen.className="recurso-destacado-eva-imagen";
      imagen.src=img;
      imagen.alt=String(recurso.imagen_alt||"").trim().slice(0,220);
      imagen.loading="lazy";imagen.decoding="async";
      const signo=document.createElement("span");
      signo.className="recurso-destacado-eva-signo";
      signo.setAttribute("aria-hidden","true");
      imagen.addEventListener("error",()=>{
        visual.remove();
        articulo.classList.remove("recurso-destacado-eva-con-imagen");
      },{once:true});
      visual.append(imagen,signo);
      articulo.appendChild(visual);
      articulo.classList.add("recurso-destacado-eva-con-imagen");
    }
    const cuerpo=document.createElement("div");cuerpo.className="recurso-destacado-eva-contenido";
    const etiqueta=document.createElement("span");etiqueta.className="recurso-destacado-eva-modulo";etiqueta.textContent=modulo;
    const titulo=document.createElement("h3");titulo.textContent=String(recurso.titulo).trim();
    const descripcion=document.createElement("p");descripcion.textContent=String(recurso.descripcion).trim();
    const link=document.createElement("a");link.className="recurso-destacado-eva-enlace";
    link.href=href;link.target="_blank";link.rel="noopener noreferrer";
    link.textContent="Explorar recurso";link.setAttribute("aria-label","Explorar "+titulo.textContent+" (abre una nueva pestaña)");
    // CSS amplía el área pulsable del enlace sin crear enlaces anidados.
    cuerpo.append(etiqueta,titulo,descripcion,link);articulo.appendChild(cuerpo);
    return articulo;
  }
  let ultimaConsulta=0;
  let numeroConsulta=0;
  async function cargar(){
    const numero=++numeroConsulta;
    ultimaConsulta=Date.now();
    try{
      const url=new URL(api);
      url.searchParams.set("select","modulo,titulo,descripcion,enlace_url,imagen_url,imagen_alt,orden");
      url.searchParams.set("visible","eq.true");
      url.searchParams.set("order","orden.asc,id.asc");
      url.searchParams.set("limit","4");
      const respuesta=await fetch(url.href,{
        headers:{apikey:publicKey,Accept:"application/json"},
        credentials:"omit",cache:"no-store"
      });
      if(!respuesta.ok)throw new Error("Recursos destacados no disponibles");
      const filas=await respuesta.json();
      // Evitar que una respuesta anterior sobrescriba un cambio más reciente.
      if(numero!==numeroConsulta)return;
      if(!Array.isArray(filas))throw new Error("Respuesta inválida");
      const tarjetas=filas.map(tarjeta).filter(Boolean);
      if(!tarjetas.length)return;
      contenedor.replaceChildren(...tarjetas);
      const modulos=new Set(tarjetas.map(item=>item.dataset.modulo));
      if(modulos.size===1) seccion.dataset.modulo=tarjetas[0].dataset.modulo;
      else seccion.removeAttribute("data-modulo");
      seccion.hidden=false;
    }catch{
      if(numero!==numeroConsulta)return;
      // Una pérdida temporal de conexión al regresar a la pestaña no debe
      // borrar tarjetas que ya estaban visibles correctamente.
      if(!contenedor.children.length){
        seccion.hidden=true;
        contenedor.replaceChildren();
        seccion.removeAttribute("data-modulo");
      }
    }
  }
  cargar();
  // La portada puede permanecer abierta durante la edición en otra pestaña.
  // Releer solo al regresar, sin sondeo continuo ni afectar otros módulos.
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible"&&Date.now()-ultimaConsulta>1000)cargar();
  });
  window.addEventListener("pageshow",evento=>{
    if(evento.persisted&&Date.now()-ultimaConsulta>1000)cargar();
  });
})();