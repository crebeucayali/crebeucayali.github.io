(() => {
  "use strict";
  const seccion=document.querySelector(".impacto-crebe");
  const pista=seccion?.querySelector(".impacto-pista");
  if(!pista) return;
  const endpoint="https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/";
  const headers={apikey:"sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq",Accept:"application/json"};
  const solicitar=async ruta=>{
    const respuesta=await fetch(endpoint+ruta,{headers,credentials:"omit",cache:"no-store"});
    if(!respuesta.ok) throw new Error("Indicadores no disponibles");
    const datos=await respuesta.json();
    if(!Array.isArray(datos)) throw new Error("Formato de indicadores no válido");
    return datos;
  };
  const crear=(fila)=>{
    const tarjeta=document.createElement("article");
    tarjeta.className="impacto-tarjeta";
    const cifra=document.createElement("strong"); cifra.textContent=fila.cifra;
    const titulo=document.createElement("h3"); titulo.textContent=fila.titulo;
    const descripcion=document.createElement("p"); descripcion.textContent=fila.descripcion;
    tarjeta.append(cifra,titulo,descripcion);
    return tarjeta;
  };

  // Mantener dos grupos idénticos para un ciclo continuo sin saltos.
  // Si hay pocos indicadores, repetir visualmente hasta cubrir el ancho visible.
  const originales=Array.from(pista.querySelectorAll(".impacto-tarjeta:not([aria-hidden='true'])")).map(el=>el.cloneNode(true));
  let tarjetasActuales=originales;
  const actualizarMovimiento=()=>{
    if(!tarjetasActuales.length){pista.replaceChildren();return;}
    const ancho=window.innerWidth<=720?245:285;
    const paso=ancho+22;
    const viewport=seccion.querySelector(".impacto-carrusel")?.clientWidth||0;
    const copias=Math.max(1,Math.ceil((viewport+paso)/(paso*tarjetasActuales.length)));
    const base=[];
    for(let repeticion=0;repeticion<copias;repeticion++){
      for(const tarjeta of tarjetasActuales){
        const clon=tarjeta.cloneNode(true);
        if(repeticion>0){clon.setAttribute("aria-hidden","true");clon.setAttribute("role","presentation");}
        base.push(clon);
      }
    }
    const segundo=base.map(tarjeta=>{
      const clon=tarjeta.cloneNode(true);
      clon.setAttribute("aria-hidden","true");
      clon.setAttribute("role","presentation");
      return clon;
    });
    pista.replaceChildren(...base,...segundo);
    pista.style.setProperty("--impacto-duracion",Math.max(16,base.length*6.33)+"s");
  };
  actualizarMovimiento();
  let anchoAnterior=seccion.querySelector(".impacto-carrusel")?.clientWidth||0;
  window.addEventListener("resize",()=>{
    const nuevoAncho=seccion.querySelector(".impacto-carrusel")?.clientWidth||0;
    if(Math.abs(nuevoAncho-anchoAnterior)>20){
      anchoAnterior=nuevoAncho;
      actualizarMovimiento();
    }
  });
  async function cargar(){
    try{
      const [config,filas]=await Promise.all([
        solicitar("eva_indicadores_config?select=etiqueta,titulo,descripcion&id=eq.1"),
        solicitar("eva_indicadores_institucionales?select=cifra,titulo,descripcion,orden&visible=eq.true&order=orden.asc,id.asc")
      ]);
      if(config[0]){
        const etiqueta=seccion.querySelector(".impacto-etiqueta");
        const titulo=seccion.querySelector("#impacto-crebe-titulo");
        const descripcion=seccion.querySelector(".impacto-encabezado > p:last-child");
        if(etiqueta) etiqueta.textContent=config[0].etiqueta;
        if(titulo) titulo.textContent=config[0].titulo;
        if(descripcion) descripcion.textContent=config[0].descripcion;
      }
      tarjetasActuales=filas.map(crear);
      actualizarMovimiento();
      seccion.hidden=filas.length===0;
    }catch(error){
      // Conservar los seis indicadores estáticos originales si falla la conexión.
    }
  }
  cargar();
})();