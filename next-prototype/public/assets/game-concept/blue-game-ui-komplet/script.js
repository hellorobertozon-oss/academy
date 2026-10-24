// UI łatwo włączyć do gry. Wartości początkowe odpowiadają referencji.
const state = {progress:54, hearts:9, energy:42, points:6547, seconds:54};
const $ = id => document.getElementById(id);
const clamp = (n, a, b) => Math.max(a, Math.min(b, Number.isFinite(+n) ? +n : a));
const formatTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

function redraw(){
  $('topFillClip').setAttribute('width', 638 * state.progress / 100);
  $('energyFillClip').setAttribute('width', 650 * state.energy / 100);
  // Jeden segment = jeden punkt życia. Pełne serca są turkusowe, puste granatowe.
  document.querySelectorAll('#heartSegments rect').forEach((rect, i) => {
    rect.setAttribute('fill', i < state.hearts ? 'url(#cyanFill)' : '#0878bd');
    rect.setAttribute('opacity', i < state.hearts ? '1' : '.67');
  });
  $('scoreText').textContent = String(state.points);
  $('timerText').textContent = formatTime(state.seconds);
  $('progressLabel').textContent = `${state.progress}%`;
  $('heartsLabel').textContent = `${state.hearts}/14`;
  $('energyLabel').textContent = `${state.energy}%`;
  $('timerLabel').textContent = formatTime(state.seconds);
  $('pointsLabel').textContent = state.points.toLocaleString('pl-PL');
  for(const [id, val] of Object.entries({progress:state.progress,hearts:state.hearts,energy:state.energy,points:state.points,seconds:state.seconds})){
    const el = $(id); if(el && document.activeElement !== el) el.value=val;
  }
}
function setUI(key, value){
  const ranges={progress:[0,100],hearts:[0,14],energy:[0,100],points:[0,99999],seconds:[0,5999]};
  state[key] = Math.round(clamp(value,...ranges[key])); redraw();
}
window.gameUI={setProgress:v=>setUI('progress',v),setHearts:v=>setUI('hearts',v),setEnergy:v=>setUI('energy',v),setPoints:v=>setUI('points',v),setSeconds:v=>setUI('seconds',v),getState:()=>({...state})};
Object.keys(state).forEach(id=>$(id)?.addEventListener('input',event=>setUI(id,event.target.value)));
$('transparentToggle')?.addEventListener('change',e=>$('stage').classList.toggle('transparent',e.target.checked));
let tick=null;
$('playPause')?.addEventListener('click',()=>{
  if(tick){clearInterval(tick);tick=null;$('playPause').textContent='▶ Uruchom czas';return;}
  $('playPause').textContent='Ⅱ Pauza';
  tick=setInterval(()=>{
    if(state.seconds<=0){clearInterval(tick);tick=null;$('playPause').textContent='▶ Uruchom czas';return;}
    setUI('seconds', state.seconds-1);
  },1000);
});
$('reset')?.addEventListener('click',()=>{Object.assign(state,{progress:54,hearts:9,energy:42,points:6547,seconds:54});redraw();});
// Zapis całej kompozycji SVG. Eksporty pojedynczych komponentów znajdują się w ZIP.
$('saveSvg')?.addEventListener('click',()=>{
  const source=$('stage').querySelector('svg').cloneNode(true);
  source.setAttribute('xmlns','http://www.w3.org/2000/svg');
  source.setAttribute('width','800');source.setAttribute('height','800');
  source.removeAttribute('aria-label');
  const content=new XMLSerializer().serializeToString(source);
  const url=URL.createObjectURL(new Blob([content],{type:'image/svg+xml;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='game-ui-elements.svg';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
redraw();
