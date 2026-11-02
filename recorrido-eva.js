/* EVA-CREBE: bienvenida y recorrido guiado. Sin analítica ni datos personales. */
(()=>{'use strict';
const KEY='eva_crebe_recorrido_general_v1', SESSION='eva_crebe_recorrido_omitido_sesion_v1';
const entries=[
['Bienvenido a EVA-CREBE','Conoce los recursos y servicios del Ecosistema Virtual Accesible del CREBE Señor de los Milagros de Ucayali.','#titulo-herramientas-eva'],
['Buscador de EVA','Busca recursos escribiendo palabras como materiales, braille, señas o noticias. También puedes utilizar las sugerencias que aparecen debajo del buscador.','#buscador-modulos'],
['Herramientas de accesibilidad','Utiliza el botón de Accesibilidad para adaptar la lectura y la visualización de la plataforma a tus necesidades.',null],
['CAP: Capacitaciones CREBE','Consulta las jornadas de capacitación, sus sesiones y materiales de formación.','.tarjeta.capacitaciones'],
['BDA: Banco Digital Accesible','Encuentra recursos de Lengua de Señas Peruana y del sistema Braille.','.tarjeta.banco'],
['MEA: Materiales Educativos Accesibles','Explora pictogramas, recursos para practicar Braille y materiales educativos accesibles.','.tarjeta.materiales'],
['NI: Noti Inclusivos','Conoce noticias y contenidos sobre inclusión educativa, discapacidad y accesibilidad.','.tarjeta.noti'],
['RA: Repositorio Accesible','Consulta los materiales y recursos físicos que ofrece el centro de recursos del CREBE.','.tarjeta.repositorio'],
['DUA 3.0','Conoce el Diseño Universal para el Aprendizaje, sus directrices y ejemplos de aplicación en la práctica docente.','.tarjeta.dua-3'],
['AC: Firma tu visita','Puedes registrar voluntariamente tu visita a EVA-CREBE desde el acceso institucional Firma tu visita.','.firma-visita-acceso'],
['Ya puedes explorar EVA','Has conocido los principales espacios de EVA-CREBE. Puedes volver a iniciar este recorrido cuando lo necesites.',null]
];
const read=(k,storage)=>{try{return storage.getItem(k)}catch{return null}};
const save=(k,v,storage)=>{try{storage.setItem(k,v)}catch{}};
const panel=document.createElement('section');panel.className='eva-tour-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Recorrido guiado de EVA-CREBE');panel.hidden=true;
const launcher=document.createElement('button');launcher.className='eva-tour-launch';launcher.type='button';launcher.textContent='Iniciar recorrido';launcher.setAttribute('aria-label','Iniciar nuevamente el recorrido de EVA');launcher.hidden=true;
const dimmer=document.createElement('div');dimmer.className='eva-tour-dimmer';dimmer.setAttribute('aria-hidden','true');dimmer.hidden=true;
document.body.append(dimmer,panel,launcher);
let index=0,active=false,lastFocus=null,highlight=null,mode='welcome',audio=false;
const synth=window.speechSynthesis;

function stop(){if(synth)try{synth.cancel()}catch{}}
function clearHighlight(){dimmer.hidden=true;if(highlight){highlight.classList.remove('eva-tour-highlight');highlight=null}}
function close(){stop();clearHighlight();active=false;panel.hidden=true;launcher.hidden=false;lastFocus?.focus?.()}
function setState(value){save(KEY,value,localStorage)}
function btn(label,cls,fn){const b=document.createElement('button');b.type='button';b.className='eva-tour-btn '+(cls||'');b.textContent=label;b.addEventListener('click',fn);return b}
function addHeading(title,kicker){const k=document.createElement('span');k.className='eva-tour-kicker';k.textContent=kicker;panel.append(k);const h=document.createElement('h2');h.textContent=title;panel.append(h)}
function p(text){const el=document.createElement('p');el.textContent=text;panel.append(el)}
function actions(...buttons){const row=document.createElement('div');row.className='eva-tour-actions';row.append(...buttons);panel.append(row)}
function positionTarget(){clearHighlight();if(mode!=='tour')return;const selector=entries[index][2];let el=selector?document.querySelector(selector):null;
if(index===2){el=document.querySelector('[aria-label*="Accesibilidad"],#boton-accesibilidad,.boton-accesibilidad,[data-accesibilidad]')||null}
if(index===9){el=[...document.querySelectorAll('a,button')].find(n=>/firma tu visita/i.test(n.textContent||n.getAttribute('aria-label')||''))||null}
if(el){dimmer.hidden=false;highlight=el;el.classList.add('eva-tour-highlight');const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;el.scrollIntoView({block:'center',behavior:reduce?'instant':'smooth'});}
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
window.addEventListener('load',()=>setTimeout(start,950),{once:true});if(document.readyState==='complete')setTimeout(start,950);
if(read(KEY,localStorage)==='completado'||read(KEY,localStorage)==='descartado'||read(SESSION,sessionStorage)==='1')launcher.hidden=false;

})();
