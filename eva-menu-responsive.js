/* Navegación EVA: cajón derecho con accesos adicionales agrupados, por clic/toque. */
(function(){
 "use strict";
 const header=document.querySelector(".cabecera-crebe");
 const nav=header?.querySelector("#eva-nav-principal");
 const toggle=document.getElementById("eva-menu-toggle");
 const closeMenu=document.getElementById("eva-menu-cerrar");
 const fondo=document.getElementById("eva-menu-fondo");
 const more=document.getElementById("eva-mas-toggle");
 const morePanel=document.getElementById("eva-mas-panel");
 const moreClose=document.getElementById("eva-mas-cerrar");
 if(!header||!nav||!toggle||!more||!morePanel||!fondo)return;
 const mq=window.matchMedia("(max-width:1050px)");
 let focusReturn=null;
 const menuVisible=()=>header.classList.contains("eva-menu-abierto");
 const moreVisible=()=>more.getAttribute("aria-expanded")==="true";
 const updateBackground=()=>{
   const active=menuVisible()||moreVisible();
   fondo.hidden=!active;
   document.body.classList.toggle("eva-menu-bloqueo",active);
 };
 function closeMore(restore=false){
   if(!moreVisible())return;
   more.setAttribute("aria-expanded","false");
   morePanel.hidden=true;
   header.classList.remove("eva-mas-abierto");
   if(restore)more.focus();
   updateBackground();
 }
 function openMore(){
   header.classList.add("eva-mas-abierto");
   morePanel.hidden=false;
   more.setAttribute("aria-expanded","true");
   updateBackground();
   if(!mq.matches)morePanel.querySelector("a")?.focus();
 }
 function closeMenuPanel(restore=false){
   if(!menuVisible())return;
   closeMore(false);
   header.classList.remove("eva-menu-abierto");
   toggle.setAttribute("aria-expanded","false");
   toggle.setAttribute("aria-label","Abrir menú de navegación");
   nav.setAttribute("aria-hidden","true");
   updateBackground();
   if(restore)toggle.focus();
 }
 function openMenu(){
   if(!mq.matches)return;
   focusReturn=document.activeElement;
   header.classList.add("eva-menu-abierto");
   toggle.setAttribute("aria-expanded","true");
   toggle.setAttribute("aria-label","Cerrar menú de navegación");
   nav.removeAttribute("aria-hidden");
   updateBackground();
   nav.querySelector("#eva-menu-cerrar")?.focus();
 }
 toggle.addEventListener("click",()=>menuVisible()?closeMenuPanel(true):openMenu());
 closeMenu?.addEventListener("click",()=>closeMenuPanel(true));
 more.addEventListener("click",()=>moreVisible()?closeMore(true):openMore());
 moreClose?.addEventListener("click",()=>closeMore(true));
 fondo.addEventListener("click",()=>{
   if(menuVisible())closeMenuPanel(true);
   else closeMore(true);
 });
 nav.addEventListener("click",event=>{
   if(!event.target.closest("a,#admin-toggle"))return;
   if(menuVisible())closeMenuPanel(false);
   else closeMore(false);
 });
 document.addEventListener("keydown",event=>{
   if(!menuVisible()&&!moreVisible())return;
   if(event.key==="Escape"){
     event.preventDefault();
     if(moreVisible() && !mq.matches)closeMore(true);
     else closeMenuPanel(true);
     return;
   }
   if(event.key!=="Tab")return;
   const activeRegion=menuVisible()?nav:morePanel;
   const nodes=[...activeRegion.querySelectorAll("a[href],button:not([disabled])")]
     .filter(el=>!el.closest("[hidden]") && el.getClientRects().length>0);
   if(!nodes.length)return;
   const first=nodes[0],last=nodes[nodes.length-1];
   if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
 });
 mq.addEventListener?.("change",()=>{
   if(menuVisible())closeMenuPanel(false);
   if(moreVisible())closeMore(false);
   nav.removeAttribute("aria-hidden");
 });
})();
