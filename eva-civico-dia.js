(() => {
  "use strict";
  const bloque=document.getElementById("eva-civico-hoy"),contenido=document.getElementById("eva-civico-hoy-contenido");
  if(!bloque||!contenido)return;
  const API="https://dteimbhwtzghhsijeeld.supabase.co";
  const KEY="sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const DESTINO="https://crebeucayali.github.io/accesos-complementarios/recursos/calendario-civico.html";
  const fechaPeru=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const fechaSegura=()=>{const p=new Intl.DateTimeFormat("en-US",{timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const get=x=>p.find(y=>y.type===x)?.value;return get("year")+"-"+get("month")+"-"+get("day");};
  let revision=0,fechaAnterior="";
  const el=(tag,clase,txt)=>{const n=document.createElement(tag);if(clase)n.className=clase;if(txt!==undefined)n.textContent=txt;return n;};
  const imagenValida=url=>typeof url==="string"&&/^https:\/\/dteimbhwtzghhsijeeld\.supabase\.co\/storage\/v1\/object\/public\/eva-publico\/calendario\/civico\/[a-z0-9._/-]+\.(webp|png|jpe?g)$/i.test(url);
  function pintar(items,fecha){
    contenido.replaceChildren();bloque.hidden=true;
    const orden=items.filter(x=>x.visible&&x.fecha===fecha&&typeof x.titulo==="string"&&typeof x.contenido==="string")
      .sort((a,b)=>(a.prioridad||2)-(b.prioridad||2)||a.titulo.localeCompare(b.titulo,"es"));
    if(!orden.length)return;
    const primero=orden[0];
    const principal=el("article","eva-civico-tarjeta");
    if(imagenValida(primero.imagen_url)){
      const foto=el("img","eva-civico-foto");
      foto.src=primero.imagen_url;foto.alt=String(primero.imagen_alt||"Imagen de la conmemoración").slice(0,220);
      foto.loading="lazy";foto.decoding="async";principal.append(foto);
    }
    const cuerpo=el("div","eva-civico-texto");
    cuerpo.append(el("span","eva-civico-fecha","Conmemoración del día · "+fecha.split("-").reverse().join("/")),
      el("h3","",primero.titulo),el("p","",primero.contenido));
    const link=el("a","eva-civico-enlace","Consultar calendario cívico");link.href=DESTINO;
    cuerpo.append(link);principal.append(cuerpo);contenido.append(principal);
    if(orden.length>1){
      const extras=el("div","eva-civico-extras");
      extras.append(el("h3","","También se conmemora hoy"));
      for(const x of orden.slice(1)){
        const articulo=el("article","eva-civico-extra");
        articulo.append(el("h4","",x.titulo),el("p","",x.contenido.slice(0,260)));
        extras.append(articulo);
      }
      contenido.append(extras);
    }
    bloque.hidden=false;
  }
  async function cargar(){
    const fecha=fechaSegura(),token=++revision;
    if(fechaAnterior&&fechaAnterior!==fecha){bloque.hidden=true;contenido.replaceChildren();}
    fechaAnterior=fecha;
    try{
      const url=API+"/rest/v1/calendario_civico_tarjetas?select=fecha,titulo,categoria,contenido,imagen_url,imagen_alt,prioridad,visible&fecha=eq."+fecha+"&visible=eq.true&order=prioridad.asc";
      const resp=await fetch(url,{headers:{apikey:KEY,Accept:"application/json"},cache:"no-store",credentials:"omit"});
      if(!resp.ok)throw Error("No se pudo consultar la programación");
      const items=await resp.json();
      if(token!==revision||fecha!==fechaSegura())return;
      pintar(Array.isArray(items)?items:[],fecha);
    }catch(error){if(token!==revision)return;bloque.hidden=true;contenido.replaceChildren();console.warn("EVA: calendario cívico no disponible",error);}
  }
  cargar();
  setInterval(cargar,60000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)cargar();});
})();