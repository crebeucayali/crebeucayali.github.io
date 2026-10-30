(() => {
 "use strict";
 if (location.pathname !== "/" && location.pathname !== "/index.html") return;
 const API="https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/eva_comunicados_emergentes";
 const KEY="sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
 const fecha=new Date().toISOString();
 const query="?select=id,titulo,contenido,tipo,imagen_url,enlace_url,enlace_texto,frecuencia,version,destinos,prioridad,creado_en&estado=eq.publicado&or=(inicio.is.null,inicio.lte."+encodeURIComponent(fecha)+")&order=prioridad.desc,creado_en.desc&limit=20";
 const consulta=API+query;
 function seguraImagen(valor) {
   try {const u=new URL(valor);return u.protocol==="https:"&&u.hostname==="dteimbhwtzghhsijeeld.supabase.co"&&u.pathname.startsWith("/storage/v1/object/public/eva-comunicados/")?u.href:null;}catch{return null;}
 }
 function seguraEnlace(valor) {try {const u=new URL(valor);return u.protocol==="https:"?u.href:null;}catch{return null;}}
 function clave(x){return "eva-comunicado-sesion:"+x.id+":"+x.version;}
 function visto(x){try{return sessionStorage.getItem(clave(x))==="1";}catch{return false;}}
 function marcar(x){try{sessionStorage.setItem(clave(x),"1");}catch{}}
 function mostrar(x){
   const anterior=document.activeElement;
   const fondo=document.createElement("div");fondo.className="eva-popup-fondo";
   const dialogo=document.createElement("section");dialogo.className="eva-popup";dialogo.setAttribute("role","dialog");dialogo.setAttribute("aria-modal","true");dialogo.setAttribute("aria-labelledby","eva-popup-titulo");dialogo.setAttribute("aria-describedby","eva-popup-contenido");
   const cerrar=document.createElement("button");cerrar.type="button";cerrar.className="eva-popup-cerrar";cerrar.textContent="×";cerrar.setAttribute("aria-label","Cerrar comunicado");
   const titulo=document.createElement("h2");titulo.id="eva-popup-titulo";titulo.textContent=x.titulo;
   const cuerpo=document.createElement("p");cuerpo.id="eva-popup-contenido";cuerpo.textContent=x.contenido;
   const cerrarPopup=()=>{marcar(x);document.removeEventListener("keydown",teclado);fondo.remove();document.body.classList.remove("eva-popup-abierto");anterior?.focus?.();};
   const teclado=e=>{if(e.key==="Escape")cerrarPopup();if(e.key==="Tab"){const lista=[...dialogo.querySelectorAll("button,a[href]")];const primero=lista[0],ultimo=lista.at(-1);if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}}};
   cerrar.addEventListener("click",cerrarPopup);
   dialogo.append(cerrar);
   const imgUrl=seguraImagen(x.imagen_url);if(imgUrl){const img=document.createElement("img");img.src=imgUrl;img.alt="Imagen del comunicado: "+x.titulo;img.className="eva-popup-imagen";img.loading="eager";dialogo.append(img);}
   dialogo.append(titulo,cuerpo);
   const link=seguraEnlace(x.enlace_url);if(link){const a=document.createElement("a");a.href=link;a.textContent=x.enlace_texto||"Más información";a.target="_blank";a.rel="noopener noreferrer";a.className="eva-popup-enlace";dialogo.append(a);}
   const continuar=document.createElement("button");continuar.type="button";continuar.className="eva-popup-continuar";continuar.textContent="Cerrar y continuar navegando";continuar.addEventListener("click",cerrarPopup);dialogo.append(continuar);
   fondo.append(dialogo);document.body.append(fondo);document.body.classList.add("eva-popup-abierto");document.addEventListener("keydown",teclado);cerrar.focus();
 }
 async function iniciar(){
   try{
     const resp=await fetch(consulta,{headers:{apikey:KEY,Accept:"application/json"},cache:"no-store"});
     if(!resp.ok)return;
     const lista=await resp.json();if(!Array.isArray(lista))return;
     const anuncio=lista.find(x=>Array.isArray(x.destinos)&&x.destinos.includes("principal")&&x.frecuencia!=="por_sesion"||Array.isArray(x.destinos)&&x.destinos.includes("principal")&&x.frecuencia==="por_sesion"&&!visto(x));
     if(anuncio)mostrar(anuncio);
   }catch{}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",iniciar,{once:true});else iniciar();
})();
