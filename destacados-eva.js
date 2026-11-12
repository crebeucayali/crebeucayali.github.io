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
  function imagenValida(valor){
    if(!valor)return null;
    try{
      const url=new URL(valor);
      return url.protocol==="https:"&&url.hostname==="crebeucayali.github.io"&&
        !url.username&&!url.password&&/\.(png|jpe?g|webp|gif|avif)$/i.test(url.pathname)?url.href:null;
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
      const imagen=document.createElement("img");imagen.className="recurso-destacado-eva-imagen";
      imagen.src=img;imagen.alt="";imagen.loading="lazy";imagen.decoding="async";
      imagen.addEventListener("error",()=>imagen.remove(),{once:true});
      articulo.appendChild(imagen);
    }
    const cuerpo=document.createElement("div");cuerpo.className="recurso-destacado-eva-contenido";
    const etiqueta=document.createElement("span");etiqueta.className="recurso-destacado-eva-modulo";etiqueta.textContent=modulo;
    const titulo=document.createElement("h3");titulo.textContent=String(recurso.titulo).trim();
    const descripcion=document.createElement("p");descripcion.textContent=String(recurso.descripcion).trim();
    const link=document.createElement("a");link.className="recurso-destacado-eva-enlace";
    link.href=href;link.target="_blank";link.rel="noopener noreferrer";
    link.textContent="Explorar recurso";link.setAttribute("aria-label","Explorar "+titulo.textContent+" (abre una nueva pestaña)");
    cuerpo.append(etiqueta,titulo,descripcion,link);articulo.appendChild(cuerpo);
    return articulo;
  }
  async function cargar(){
    try{
      const url=new URL(api);
      url.searchParams.set("select","modulo,titulo,descripcion,enlace_url,imagen_url,orden");
      url.searchParams.set("visible","eq.true");
      url.searchParams.set("order","orden.asc,id.asc");
      url.searchParams.set("limit","4");
      const respuesta=await fetch(url.href,{
        headers:{apikey:publicKey,Accept:"application/json"},
        credentials:"omit",cache:"no-store"
      });
      if(!respuesta.ok)throw new Error("Recursos destacados no disponibles");
      const filas=await respuesta.json();
      if(!Array.isArray(filas))throw new Error("Respuesta inválida");
      const tarjetas=filas.map(tarjeta).filter(Boolean);
      if(!tarjetas.length)return;
      contenedor.replaceChildren(...tarjetas);
      seccion.hidden=false;
    }catch{
      // Ante errores de red o ausencia de registros, no mostrar un bloque vacío.
      seccion.hidden=true;contenedor.replaceChildren();
    }
  }
  cargar();
})();