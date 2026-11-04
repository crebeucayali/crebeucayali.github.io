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
      pista.replaceChildren(...filas.map(crear));
      seccion.hidden=filas.length===0;
    }catch(error){
      // Conservar los seis indicadores estáticos originales si falla la conexión.
    }
  }
  cargar();
})();