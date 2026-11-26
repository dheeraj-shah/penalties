(()=>{const q=s=>document.querySelector(s),frame=q('.play-frame'),arena=q('.arena');document.body.dataset.concept='broadcast';const bar=document.createElement('div');bar.className='broadcast-bar';const title=document.createElement('strong');title.className='broadcast-title';title.textContent='PENALTIES';bar.append(title,q('.arena-hud'),q('.game-toolbar'));frame.prepend(bar);const deck=document.createElement('div');deck.className='pitch-deck';deck.append(q('.controls'));frame.append(deck);arena.append(q('.chat-panel'));const full=document.createElement('button');full.type='button';full.className='fullscreen-button';const updateFull=()=>{
  const expanded=document.fullscreenElement===frame;
  full.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#mingcute-fullscreen-'+(expanded?'exit-':'')+'2-line"></use></svg>';
  full.setAttribute('aria-label',expanded?'Exit game fullscreen':'Expand game to fullscreen');
  full.setAttribute('aria-pressed',String(expanded));
  full.title=expanded?'Exit fullscreen':'Fullscreen';
};document.addEventListener('fullscreenchange',updateFull);updateFull();
full.onclick=async()=>{try{if(document.fullscreenElement===frame)await document.exitFullscreen();else await frame.requestFullscreen();}catch{q('#result').textContent='Fullscreen is unavailable in this browser';}};q('.game-toolbar').append(full);q('.scoreboard .label').textContent='GOALS';
const chat=q('.chat-panel'), composer=q('.composer'), log=q('#history');
chat.classList.add('conversation-studio');
q('.studio-history-head').remove();
q('#studio-latest').setAttribute('aria-hidden','true');
q('#timing-announcement').removeAttribute('aria-hidden');
log.hidden=true; // Keep state and history storage; remove the transcript from sight and tab order.
const head=q('.chat-head'), heading=head.querySelector('h2');
heading.id='game-studio-heading';
heading.textContent='Game Studio';
chat.setAttribute('aria-labelledby',heading.id);
head.hidden=false;
const menu=document.createElement('details');
menu.className='studio-overflow';
const summary=document.createElement('summary');
summary.textContent='⋯';
summary.setAttribute('aria-label','Game Studio options');
const actions=document.createElement('div');
actions.className='studio-overflow-actions';
const undo=q('#undo-code'), reset=q('#reset-settings');
q('#clear-chat').hidden=true;
undo.textContent='Undo last change';
reset.textContent='Reset game';
reset.title='Restore original game settings and start a fresh round';
const closeMenu=(focus=false)=>{if(menu.open){menu.open=false;if(focus)summary.focus();}};
menu.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){event.preventDefault();closeMenu(true);}});
document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))closeMenu();});
actions.addEventListener('click',()=>closeMenu(true));
actions.append(undo,reset);
menu.append(summary,actions);head.append(menu);
chat.append(q('.connection-row'),composer,log);
const compact=matchMedia('(max-width: 1099px), (max-height: 480px)');
const pitch=q('#pitch');
let camera;
function projectedGoalClearance(field,view,fit,camera){
 const factor=fit==='contain'?Math.min(view.width/camera.width,view.height/camera.height):
   fit==='cover'?Math.max(view.width/camera.width,view.height/camera.height):null;
 const renderedHeight=factor===null?view.height:camera.height*factor;
 const bottom=view.y+(view.height-renderedHeight)/2+renderedHeight*camera.goal.bottom/camera.height;
 const top=bottom-field.y+8;
 return {top,space:field.height-top-8};
}
function placeStudio(){
 const field=arena.getBoundingClientRect(), view=pitch.getBoundingClientRect();
 const clearance=camera&&projectedGoalClearance(field,view,getComputedStyle(pitch).objectFit,camera);
 // Reserve room for the two-line composer, header and a separately scrolling log.
 const overlay=!compact.matches&&clearance&&clearance.space>=190;
 chat.dataset.studioPlacement=overlay?'overlay':'stack';
 chat.style.setProperty('--studio-goal-clear-top',overlay?clearance.top+'px':'0px');
 chat.style.setProperty('--studio-goal-clear-space',overlay?clearance.space+'px':'none');
 const parent=overlay?arena:frame;
 if(chat.parentNode===parent)return;
 const previous=chat.contains(document.activeElement)?document.activeElement:null;
 parent.append(chat);
 previous?.focus({preventScroll:true});
}
compact.addEventListener('change',placeStudio);
const resize=new ResizeObserver(placeStudio);
resize.observe(arena);resize.observe(pitch);
document.addEventListener('fullscreenchange',placeStudio);
placeStudio();
import('/penalties/camera.js').then(({CAMERA})=>{camera=CAMERA;placeStudio();}).catch(()=>{});
})();
