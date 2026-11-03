/* EVA-CREBE: bienvenida y recorrido guiado. Sin analítica ni datos personales. */
(()=>{'use strict';
const KEY='eva_crebe_recorrido_general_v1', SESSION='eva_crebe_recorrido_omitido_sesion_v1';
const entries=[
['Bienvenido a EVA-CREBE: buscador','EVA reúne recursos y servicios educativos accesibles. Utiliza este buscador para encontrar módulos y contenidos escribiendo palabras como materiales, braille, señas o noticias. También puedes seleccionar las sugerencias disponibles.','.herramientas-eva'],
['Herramientas de accesibilidad','Utiliza el botón de Accesibilidad para adaptar la lectura y la visualización de la plataforma a tus necesidades.','.eva-accesibilidad-boton'],
['Módulos oficiales de EVA','En estos seis módulos encontrarás: CAP, capacitaciones del CREBE; BDA, lengua de señas y Braille; MEA, materiales educativos accesibles; NI, noticias sobre inclusión; RA, recursos físicos del CREBE; y DUA 3.0, orientaciones y ejemplos para una enseñanza inclusiva. Selecciona el módulo que necesites para explorar sus contenidos.','.tarjetas'],
['Servicios complementarios: firma tu visita, calendario y galería','En Firma tu visita puedes registrar voluntariamente tu participación en EVA-CREBE. Este espacio está dirigido a docentes, familias, estudiantes y otras personas de la comunidad educativa que utilizan la plataforma; registrar tu visita es opcional y no es un requisito para consultar los recursos. El Calendario permite revisar actividades y fechas institucionales, y la Galería reúne fotografías y evidencias visuales de las actividades realizadas por el CREBE. Con esto, ya conoces los principales espacios de EVA y puedes explorarlos a tu ritmo.','.grid-accesos.accesos-participacion']
];
const read=(k,storage)=>{try{return storage.getItem(k)}catch{return null}};
const save=(k,v,storage)=>{try{storage.setItem(k,v)}catch{}};
const panel=document.createElement('section');panel.className='eva-tour-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Recorrido guiado de EVA-CREBE');panel.hidden=true;
const launcher=document.createElement('button');launcher.className='eva-tour-launch';launcher.type='button';launcher.textContent='Iniciar recorrido';launcher.setAttribute('aria-label','Iniciar nuevamente el recorrido de EVA');launcher.hidden=true;
// Una máscara SVG recorta un hueco transparente sin elevar el contenido original.
const NS='http://www.w3.org/2000/svg';
const svgEl=(name)=>document.createElementNS(NS,name);
const spotlight=svgEl('svg');
spotlight.classList.add('eva-tour-spotlight');
spotlight.setAttribute('aria-hidden','true');
spotlight.hidden=true;
const defs=svgEl('defs');
const mask=svgEl('mask');
const maskId='eva-tour-hole-v12';
mask.setAttribute('id',maskId);
mask.setAttribute('maskUnits','userSpaceOnUse');
mask.setAttribute('maskContentUnits','userSpaceOnUse');
mask.setAttribute('mask-type','luminance');
const white=svgEl('rect');white.setAttribute('fill','#fff');
const hole=svgEl('rect');hole.setAttribute('fill','#000');hole.setAttribute('rx','10');
mask.append(white,hole);defs.append(mask);
const tinted=svgEl('rect');tinted.setAttribute('fill','rgba(5,21,34,.55)');
tinted.setAttribute('mask','url(#'+maskId+')');
const focusRing=svgEl('rect');focusRing.setAttribute('fill','none');focusRing.setAttribute('stroke','#ef9b24');focusRing.setAttribute('stroke-width','4');focusRing.setAttribute('rx','10');focusRing.setAttribute('pointer-events','none');
spotlight.append(defs,tinted,focusRing);
document.body.append(spotlight,panel,launcher);
function hideShades(){spotlight.hidden=true}
function updateSpotlight(){
 if(!highlight||mode!=='tour'||panel.hidden)return hideShades();
 const r=highlight.getBoundingClientRect(),w=window.innerWidth,h=window.innerHeight,pad=9;
 const x=Math.max(0,Math.min(w,r.left-pad)),y=Math.max(0,Math.min(h,r.top-pad));
 const xr=Math.max(x,Math.min(w,r.right+pad)),yb=Math.max(y,Math.min(h,r.bottom+pad));
 if(xr<=x||yb<=y)return hideShades();
 spotlight.setAttribute('viewBox','0 0 '+w+' '+h);
 for(const el of [white,tinted]){el.setAttribute('x','0');el.setAttribute('y','0');el.setAttribute('width',String(w));el.setAttribute('height',String(h))}
 hole.setAttribute('x',String(x));hole.setAttribute('y',String(y));
 hole.setAttribute('width',String(xr-x));hole.setAttribute('height',String(yb-y));
 for(const key of ['x','y','width','height'])focusRing.setAttribute(key,hole.getAttribute(key));
 spotlight.hidden=false;
 placePanel();
}
function placePanel(){
 panel.classList.remove('eva-tour-panel-top');
 if(panel.hidden||!highlight||mode!=='tour')return;
 const r=highlight.getBoundingClientRect(),p=panel.getBoundingClientRect();
 const horizontalOverlap=r.left<p.right&&r.right>p.left;
 const verticalOverlap=r.top<p.bottom&&r.bottom>p.top;
 if(horizontalOverlap&&verticalOverlap){
   const freeTop=Math.max(0,r.top),freeBottom=Math.max(0,window.innerHeight-r.bottom);
   if(freeTop>freeBottom&&freeTop>Math.min(p.height,180))panel.classList.add('eva-tour-panel-top');
 }
}
let index=0,active=false,lastFocus=null,highlight=null,mode='welcome',audio=false;
const synth=window.speechSynthesis;

function stop(){if(synth)try{synth.cancel()}catch{}}
function clearHighlight(){hideShades();panel.classList.remove('eva-tour-panel-top');if(highlight){highlight.classList.remove('eva-tour-highlight');highlight=null}}
function close(){stop();clearHighlight();active=false;panel.hidden=true;launcher.hidden=false;lastFocus?.focus?.()}
function setState(value){save(KEY,value,localStorage)}
function btn(label,cls,fn){const b=document.createElement('button');b.type='button';b.className='eva-tour-btn '+(cls||'');b.textContent=label;b.addEventListener('click',fn);return b}
function addHeading(title,kicker){const k=document.createElement('span');k.className='eva-tour-kicker';k.textContent=kicker;panel.append(k);const h=document.createElement('h2');h.textContent=title;panel.append(h)}
function p(text){const el=document.createElement('p');el.textContent=text;panel.append(el)}
function actions(...buttons){const row=document.createElement('div');row.className='eva-tour-actions';row.append(...buttons);panel.append(row)}
function positionTarget(){clearHighlight();if(mode!=='tour')return;const selector=entries[index][2];let el=selector?document.querySelector(selector):null;
if(index===1){el=document.querySelector('.eva-accesibilidad-panel .eva-accesibilidad-boton')||document.querySelector('.eva-accesibilidad-boton')||null}

if(el){highlight=el;el.classList.add('eva-tour-highlight');const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;if(index!==1)el.scrollIntoView({block:index===3?'end':'center',behavior:reduce?'instant':'smooth'});updateSpotlight();requestAnimationFrame(updateSpotlight);setTimeout(updateSpotlight,350);setTimeout(updateSpotlight,700);}
}
function speak(){if(!synth||!('SpeechSynthesisUtterance' in window))return;stop();const utter=new SpeechSynthesisUtterance(entries[index][0]+'. '+entries[index][1]);utter.lang='es-PE';utter.rate=Number(panel.querySelector('#eva-tour-speed')?.value||1);synth.speak(utter)}
function render(){stop();panel.replaceChildren();mode='tour';panel.hidden=false;launcher.hidden=true;
const progress=document.createElement('div');progress.className='eva-tour-progress';const bar=document.createElement('span');bar.style.width=((index+1)/entries.length*100)+'%';progress.append(bar);panel.append(progress);
addHeading(entries[index][0],'Paso '+(index+1)+' de '+entries.length);p(entries[index][1]);
const audioRow=document.createElement('div');audioRow.className='eva-tour-audio';const label=document.createElement('label');label.textContent='Audio opcional';label.htmlFor='eva-tour-speed';const speed=document.createElement('select');speed.id='eva-tour-speed';for(const [value,name] of [['0.8','0.8×'],['1','1×'],['1.2','1.2×']]){const option=document.createElement('option');option.value=value;option.textContent=name;if(value==='1')option.selected=true;speed.append(option)}
audioRow.append(label,speed,btn('Escuchar','secondary',speak),btn('Detener','secondary',stop));if(!synth){audioRow.querySelectorAll('button,select').forEach(x=>x.disabled=true)}panel.append(audioRow);
actions(btn('Anterior','secondary',()=>{index=Math.max(0,index-1);render()}),btn(index===entries.length-1?'Finalizar':'Siguiente','',()=>{if(index===entries.length-1){setState('completado');close()}else{index++;render()}}));
actions(btn('Omitir por ahora','tertiary',()=>{save(SESSION,'1',sessionStorage);setState('pospuesto');close()}),btn('No volver a mostrar','tertiary',confirmDiscard));
positionTarget();
}
function confirmDiscard(){stop();clearHighlight();mode='confirm';panel.replaceChildren();addHeading('¿No volver a mostrar?','Confirmar descarte');const info=document.createElement('div');info.className='eva-tour-confirm';info.textContent='La ventana no volverá a aparecer automáticamente en este navegador. Podrás iniciar el recorrido manualmente. Esta preferencia puede perderse si borras los datos del sitio o usas otro navegador.';panel.append(info);actions(btn('Cancelar','secondary',()=>{if(active)render();else welcome()}),btn('Sí, descartar','',()=>{setState('descartado');close()}))}
function welcome(){active=false;mode='welcome';clearHighlight();panel.replaceChildren();panel.hidden=false;launcher.hidden=true;addHeading('Bienvenido a EVA-CREBE','Ecosistema Virtual Accesible');p('¿Te gustaría conocer los recursos y servicios de nuestra plataforma mediante un recorrido guiado con texto y audio opcional?');actions(btn('Iniciar recorrido','',()=>{active=true;index=0;render()}),btn('Omitir por ahora','secondary',()=>{save(SESSION,'1',sessionStorage);setState('pospuesto');close()}));actions(btn('No volver a mostrar','tertiary',confirmDiscard));}
function show(force=false){if(document.querySelector('.eva-popup-fondo,.eva-popup-abierto'))return false;if(!force&&(read(KEY,localStorage)==='descartado'||read(KEY,localStorage)==='completado'||read(SESSION,sessionStorage)==='1'))return false;lastFocus=document.activeElement;welcome();return true}
launcher.addEventListener('click',()=>{active=true;index=0;render()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){if(mode==='tour'){save(SESSION,'1',sessionStorage);setState('pospuesto')}close()}});
let tried=false,pausedByPopup=false;
function hasPopup(){return Boolean(document.querySelector('.eva-popup-fondo')||document.body.classList.contains('eva-popup-abierto'))}
function start(){if(tried||hasPopup())return;tried=true;show()}
const observer=new MutationObserver(()=>{
 if(hasPopup()){if(!panel.hidden){stop();clearHighlight();panel.hidden=true;launcher.hidden=true;pausedByPopup=true}return}
 if(pausedByPopup){pausedByPopup=false;if(mode==='tour'&&active)render();else if(mode==='confirm')confirmDiscard();else welcome();return}
 if(!tried)start();
});
observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('scroll',()=>{if(highlight)updateSpotlight()},{passive:true});
window.addEventListener('resize',updateSpotlight,{passive:true});
window.addEventListener('load',()=>setTimeout(start,950),{once:true});if(document.readyState==='complete')setTimeout(start,950);
if(read(KEY,localStorage)==='completado'||read(KEY,localStorage)==='descartado'||read(SESSION,sessionStorage)==='1')launcher.hidden=false;

})();
