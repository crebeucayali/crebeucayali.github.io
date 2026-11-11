/* Menú EVA: reutiliza navegación y botón de acceso administrativo existentes. */
(function(){
  "use strict";
  const header=document.querySelector(".cabecera-crebe");
  const nav=header&&header.querySelector(".pestanas-crebe");
  const button=document.getElementById("eva-menu-toggle");
  if(!header||!nav||!button)return;
  const mq=window.matchMedia("(max-width: 1050px)");
  let returnFocus=false;
  function setTop(){header.style.setProperty("--eva-menu-top",Math.max(0,Math.round(header.getBoundingClientRect().bottom))+"px")}
  function close(restore){
    if(!header.classList.contains("eva-menu-abierto"))return;
    header.classList.remove("eva-menu-abierto");
    document.body.classList.remove("eva-menu-bloqueo");
    button.setAttribute("aria-expanded","false");
    button.setAttribute("aria-label","Abrir menú de navegación");
    nav.setAttribute("aria-hidden","true");
    nav.removeAttribute("aria-modal");
    if(restore)button.focus();
  }
  function open(){
    if(!mq.matches)return;
    setTop();
    header.classList.add("eva-menu-abierto");
    document.body.classList.add("eva-menu-bloqueo");
    button.setAttribute("aria-expanded","true");
    button.setAttribute("aria-label","Cerrar menú de navegación");
    nav.removeAttribute("aria-hidden");
    const first=nav.querySelector("a");if(first)first.focus();
  }
  button.addEventListener("click",()=>header.classList.contains("eva-menu-abierto")?close(true):open());
  nav.addEventListener("click",event=>{if(event.target.closest("a, #admin-toggle"))close(false)});
  document.addEventListener("keydown",event=>{
    if(!header.classList.contains("eva-menu-abierto"))return;
    if(event.key==="Escape"){event.preventDefault();close(true);return}
    if(event.key==="Tab"){
      const nodes=[button,...nav.querySelectorAll("a,button:not([disabled])")];
      const i=nodes.indexOf(document.activeElement);
      if(event.shiftKey&&i===0){event.preventDefault();nodes[nodes.length-1].focus()}
      else if(!event.shiftKey&&i===nodes.length-1){event.preventDefault();button.focus()}
    }
  });
  mq.addEventListener("change",()=>{close(false);nav.removeAttribute("aria-hidden")});
  window.addEventListener("resize",()=>{if(header.classList.contains("eva-menu-abierto"))setTop()},{passive:true});
  window.addEventListener("scroll",()=>{if(header.classList.contains("eva-menu-abierto"))setTop()},{passive:true});
})();
