import {CROWD_VERSION,CROWD_MIX_VERSION,routeCrowd,validateCrowdRecipe} from './crowd-contract.js';
import {ATMOSPHERE_VERSION,routeAtmosphere,validateAtmosphereReply,validateAtmosphereScene,validateStandFinish} from './atmosphere-contract.js';
import {SCOPED_ART_VERSION,routeBallPrompt,validateScopedScene,validateScopedEdit,mergeScopedEdit,routeScopedPrompt,ensureScopedCompatible} from './scoped-art.js';
import {validateRegistry} from './art-contract.js';
import {renderComposer,clearComposer,recoverComposer,renderConversation,renderSling} from './ui-react.js';
import {stageArt} from './art-client.js';
import {drawFifa} from './fifa-renderer.js';
import {prepareCrowdSvg} from './crowd-renderer.js';
import {GameAudio} from './audio.js';
import {validateUI,uiProperties} from './ui.js';
import {isolatedRender,prepareGenerated,showGenerated,clearGenerated} from './sandbox-client.js';
import {SHOTS,COLORS,defaults,validatePatch,takeShot,describePatch,changeTrace,powerMotion,shotTarget,shotPosition,outcomeLabel,keeperPose,keeperReaction,roundSummary} from './game.js';
import {firstGameController} from './first-game.js';
const firstGameStores=[];for(const name of ['localStorage','sessionStorage']){try{firstGameStores.push(window[name]);}catch{}}
const firstGame=firstGameController(firstGameStores);
const $=s=>document.querySelector(s), canvas=$('#pitch'),ctx=canvas.getContext('2d');
let audioStorage;try{audioStorage=localStorage;}catch{}
const sfx=new GameAudio({storage:audioStorage});
const hudIcon=name=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#mingcute-'+name+'"></use></svg>';
function renderSound(){const b=document.getElementById('sound-toggle');b.innerHTML=hudIcon(sfx.muted?'volume-off-line':'volume-line');b.setAttribute('aria-label',sfx.muted?'Turn game sound on':'Turn game sound off');b.title=sfx.muted?'Sound off':'Sound on';b.setAttribute('aria-pressed',String(!sfx.muted));}
document.getElementById('sound-toggle').onclick=()=>{sfx.setMuted(!sfx.muted);renderSound();};renderSound();
for(const event of ['pointerdown','keydown'])document.addEventListener(event,e=>{if(e.isTrusted)sfx.unlock();},{capture:true,passive:true});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(e.isTrusted&&b&&!b.disabled&&b.id!=='shoot')sfx.play('click');},{capture:true});
let customUI={};
function setUI(ui,replace=false){const next=validateUI(replace?ui:{...customUI,...ui});for(const key of Object.keys(uiProperties(customUI)))document.body.style.removeProperty(key);customUI=next;for(const [key,value] of Object.entries(uiProperties(customUI)))document.body.style.setProperty(key,value);document.body.dataset.customUi=String(Object.keys(customUI).length>0);}
let modelChoices=[{key:"kimi-k3.1-pro",name:"Kimi K3.1 Pro"}],selectedModel="kimi-k3.1-pro";
const withPower=shots=>shots.includes('power')?shots:[...shots,'power'];
const liveSettings=(changes={})=>{const config={...defaults(),...changes};config.shots=withPower(config.shots);return config;};
let config=liveSettings(),history=[],round=[],streak=0,aim='centre',shot='standard',busy=false,chatBusy=false,aiReady=false,newShots=new Set(),feedbackTimer;
let savedArtwork=null,scopedArtwork={},atmosphereArtwork={},crowdArtwork=null;
try{const saved=JSON.parse(sessionStorage.getItem('penalties-public-v3')||'null');if(saved){savedArtwork=saved.artwork||null;try{crowdArtwork=saved.crowdArtwork==null?null:validateCrowdRecipe(saved.crowdArtwork);}catch{}try{atmosphereArtwork=validateAtmosphereScene(saved.atmosphereArtwork);}catch{}try{scopedArtwork=validateScopedScene(saved.scopedArtwork);}catch{}config=liveSettings(validatePatch(saved.config));if(saved.roundFormat!=="five-default-v1")config.attempts=5;history=Array.isArray(saved.history)?saved.history.slice(-40).filter(m=>m&&typeof m==="object").map(m=>m.code!==undefined&&!m.failed?{...m,restored:true}:m):[];if(saved.ui)setUI(saved.ui,true);}}catch{}
let currentArt={},generatedCode='',generatedLayers={},generatedState={},codeRevisions=[],generatedTargets=[],generatedKeeper=null,generatedPitch=null,generatedBall=null,generatedScene=null;
const generatedInput=phase=>({phase,aim,shot,goals:round.filter(x=>x==='goal').length,remaining:Math.max(0,config.attempts-round.length)});
const liveIdeas=[
 "Turn the kicker into a retro astronaut, with a bold round white helmet, big dark navy visor, off-white suit and orange bands. Keep the kicking motion unchanged. Change only the kicker.",
 "Turn the ball into a bright yellow triangular wedge of Swiss cheese with three dark round holes. Change only the ball.",
 "Turn the entire pitch into a grey lunar surface with huge shaded craters and crisp white field markings. Extend the grey moon surface underneath the shoot controls.",
 "Make the goalposts and crossbar hot pink.",
 "Add a huge pale golden planet with a wide slanted ring in the upper-left sky. Use clean flat shapes, keep it clearly above the skyline, and leave the rest of the sky visible.",
 "Replace the crowd with a single row of 14 tiny penguin TV reporters. Give each a white belly, an orange beak, and a raised black microphone with a bright red tip. Change only the crowd."
];
const offlinePresets=new Map([
 ['Add a finesse shot',{shots:['standard','finesse']}],
 ['Replace the penalty taker with a dinosaur',{playerCharacter:'dinosaur'}],
 ['Bring back the human player',{playerCharacter:'human'}],
 ['Put the stadium in space',{backdrop:'space'}],
 ['Add mountains behind the goal',{backdrop:'mountains'}],
 ['Remove the crowd',{crowd:false}],
 ['Add a chip shot',{shots:['standard','chip']}],
 ['Make the ball pink',{ballColor:'pink'}],
 ['Give the keeper a blue kit',{keeperColor:'blue'}],
 ['Switch to a night pitch',{pitch:'night'}],
 ['Make the keeper harder',{difficulty:'hard'}],
 ['Give me five attempts',{attempts:5}],
 ['Add low driven shots',{shots:['standard','low driven']}],
 ['Make the goalposts gold',{goalColor:'gold'}],
 ['Show my scoring streak',{showStreak:true}],
 ['Make the power shot faster',{powerSpeed:1.5}],
 ['Add a trivela shot',{shots:['standard','trivela']}],
 ['Give me ten attempts',{attempts:10}],
 ['Make the keeper easier',{difficulty:'easy'}],
 ['Make the ball yellow',{ballColor:'yellow'}],
 ['Use a light UI',{theme:'light'}],
 ['Use a neon UI',{theme:'neon'}],
 ['Make the buttons pink',{accent:'pink'}],
 ['Use a monospace font',{font:'mono'}],
 ['Make the corners square',{corners:'square'}],
 ['Move chat to the left',{chatSide:'left'}],
 ['Use a gold accent',{accent:'gold'}],
 ['Return to the dark UI',{theme:'dark'}],
]);
function persist(){try{sessionStorage.setItem('penalties-public-v3',JSON.stringify({roundFormat:"five-default-v1",config,ui:customUI,history:history.slice(-40),artwork:generatedLayers,scopedArtwork,atmosphereArtwork,crowdArtwork}));}catch{}}
function message(role,text,changes='',time='',trace=null){const entry={role,text,changes,time,trace};history.push(entry);history=history.slice(-40);persist();renderHistory();return entry;}
// The preview line represents only an active request in this page, not restored history.
let studioTiming=null, studioStatusLabel=null, studioRenderedEntry=null;
const studioSeconds=ms=>(Math.max(0,ms)/1000).toFixed(1)+'s';
const fieldGenerationTiming=$('#generation-timing');
const fieldGenerationAim=$('#result');
fieldGenerationAim.after(fieldGenerationTiming);
function alignFieldGenerationTiming(){
 const frame=fieldGenerationAim.parentElement;
 const aim=fieldGenerationAim.getBoundingClientRect(),bounds=frame.getBoundingClientRect();
 const gap=44*Math.min(1,Math.max(.75,bounds.width/900));
 const top=aim.top-bounds.top+aim.height/2+gap-frame.clientTop+frame.scrollTop;
 fieldGenerationTiming.style.setProperty('--field-timing-top',`${top}px`);
}
if(typeof ResizeObserver==='function'){
 const observer=new ResizeObserver(()=>{
  if(!fieldGenerationTiming.hidden)alignFieldGenerationTiming();
 });
 observer.observe(fieldGenerationAim);
 observer.observe(fieldGenerationAim.parentElement);
}
const fieldGenerationReduced=matchMedia('(prefers-reduced-motion: reduce)');
let fieldGenerationTimeout=null,fieldGenerationSequence=0;
function clearFieldGenerationTiming(){
 ++fieldGenerationSequence;
 clearTimeout(fieldGenerationTimeout);
 fieldGenerationTimeout=null;
 fieldGenerationTiming.hidden=true;
 fieldGenerationTiming.querySelector('strong').textContent='';
}
function showFieldGenerationTiming(seconds){
 clearFieldGenerationTiming();
 const sequence=fieldGenerationSequence;
 fieldGenerationTiming.querySelector('strong').textContent=seconds;
 alignFieldGenerationTiming();
 fieldGenerationTiming.hidden=false;
 fieldGenerationTimeout=setTimeout(()=>{
  if(sequence===fieldGenerationSequence)clearFieldGenerationTiming();
 },fieldGenerationReduced.matches?15000:15480);
}

function renderHistory(){
 const undoEntry=codeRevisions.at(-1)?.studioEntry;
 const retryEntry=history.at(-1);
 renderConversation(history,{
  undoEntry:!busy&&!chatBusy?undoEntry:null,
  retryEntry:!busy&&!chatBusy&&retryEntry?.failed&&retryEntry.prompt?retryEntry:null,
  onUndo:()=>$('#undo-code').click(),
  onRetry:()=>{if(retryEntry===history.at(-1)&&retryEntry?.failed&&retryEntry.prompt)request(retryEntry.prompt,undefined,retryEntry);}
 });
 const latest=$('#studio-latest'), announcement=$('#timing-announcement');
 const reply=history.findLast(entry=>entry.role==='assistant'&&(!entry.generating||entry===studioTiming?.entry));
 const recent=reply||history.findLast(entry=>entry.role==='user')||null;
 if(recent===studioRenderedEntry)return;
 studioRenderedEntry=recent;
 studioStatusLabel=null;
 if(studioTiming?.entry!==recent)studioTiming=null;
 latest.replaceChildren();
 if(!recent){announcement.textContent='';return;}
 if(studioTiming){
  const status=document.createElement('div');
  status.className='studio-timing';status.setAttribute('aria-hidden','true');
  studioStatusLabel=status;
  latest.append(status);
 }
 const line=document.createElement('div');
 line.className='studio-line';
 line.dataset.state=recent.failed?'failed':recent.changes?'applied':'';
 line.textContent=(recent.role==='user'?'You: ':'')+recent.text+(recent.changes?' '+recent.changes:'');
 latest.append(line);
 if(studioTiming){studioTiming.line=line;updateStudioTiming('generating');}
 else announcement.textContent=recent.role==='assistant'?line.textContent:'';
}
function updateStudioTiming(phase){
 if(!studioStatusLabel||!studioTiming)return;
 const changed=studioStatusLabel.dataset.phase!==phase;
 studioStatusLabel.dataset.phase=phase;
 const headline=phase==='ready'?studioTiming.entry.generationTime||'':phase==='failed'?'Not applied':'Generating…';
 studioStatusLabel.hidden=!headline;
 if(studioStatusLabel.textContent!==headline)studioStatusLabel.textContent=headline;
 if(changed){
  const {entry,line}=studioTiming;
  line.hidden=phase==='generating';
  line.dataset.state=entry.failed?'failed':entry.changes?'applied':'';
  if(!line.hidden)line.textContent=entry.text+(entry.changes?' '+entry.changes:'');
  $('#timing-announcement').textContent=phase==='generating'?'Generating your change.':(headline?headline+'. ':'')+line.textContent;
 }
}
const shotPicker=$('#shot-picker'), shotOptions=$('#shots'), modeButtons=document.querySelectorAll('[data-mode]');
let inputMode='buttons';
try{if(localStorage.getItem('penalties-live-input-mode')==='sling')inputMode='sling';}catch{}
const shotDescriptions={
 standard:'A normal strike.',chip:'A soft lob over the keeper.',finesse:'A placed curler.',
 'low driven':'A fast shot along the ground.',trivela:'An outside-foot bend.',power:'A hard hit with a longer wind-up.'
};
const shotTooltip=document.createElement('div');
shotTooltip.className='warm-shot-tooltip';shotTooltip.hidden=true;shotTooltip.setAttribute('role','tooltip');shotTooltip.setAttribute('aria-hidden','true');
shotOptions.append(shotTooltip);
let shotHintTimer=0,shotHintTarget=null,shotHintWarmUntil=0;
function hideShotHint(reset=false){
 clearTimeout(shotHintTimer);shotHintTimer=0;
 if(!shotTooltip.hidden)shotHintWarmUntil=performance.now()+300;
 shotTooltip.hidden=true;shotHintTarget=null;
 if(reset)shotHintWarmUntil=0;
}
function shotHintText(button){
 return shotDescriptions[button.dataset.shot];
}
function showShotHint(button,keyboard=false){
 if(shotOptions.hidden||busy||shotHintTarget===button)return;
 clearTimeout(shotHintTimer);shotHintTarget=button;
 const show=()=>{
  if(shotHintTarget!==button||shotOptions.hidden)return;
  shotTooltip.textContent=shotHintText(button);
  shotTooltip.style.setProperty('--shot-hint-x',(button.offsetLeft+button.offsetWidth/2)+'px');
  shotTooltip.hidden=false;
 };
 if(keyboard||!shotTooltip.hidden||performance.now()<shotHintWarmUntil)show();
 else shotHintTimer=setTimeout(show,400);
}
shotOptions.addEventListener('pointermove',event=>{
 if(event.pointerType==='touch')return;
 const button=event.target.closest('button[data-shot]');
 if(button)showShotHint(button);
 else hideShotHint();
});
shotOptions.addEventListener('pointerleave',()=>{const focused=shotOptions.querySelector('button[data-shot]:focus-visible');if(focused)showShotHint(focused,true);else hideShotHint();});
shotOptions.addEventListener('focusin',event=>{if(event.target.matches('button[data-shot]:focus-visible'))showShotHint(event.target,true);});
shotOptions.addEventListener('focusout',event=>{if(!shotOptions.contains(event.relatedTarget))hideShotHint();});
function pickerOpen(open,focus=false){
 shotPicker.setAttribute('aria-expanded',String(open));shotOptions.hidden=!open;
 if(!open)hideShotHint(true);
 if(!focus)return;
 (open?(shotOptions.querySelector('button[aria-pressed=true]:enabled')||shotOptions.querySelector('button:enabled')):shotPicker)?.focus();
}
shotPicker.onclick=()=>pickerOpen(shotOptions.hidden,true);
$('.shot-row').addEventListener('keydown',event=>{
 if(!shotOptions.hidden&&event.key==='Escape'){event.preventDefault();event.stopPropagation();pickerOpen(false,true);}
 if(event.target===shotPicker&&event.key==='ArrowDown'&&shotOptions.hidden){event.preventDefault();pickerOpen(true,true);}
});
document.addEventListener('click',event=>{if(!shotOptions.hidden&&!$('.shot-row').contains(event.target))pickerOpen(false);});
for(const button of modeButtons)button.onclick=()=>{
 inputMode=button.dataset.mode;
 try{localStorage.setItem('penalties-live-input-mode',inputMode);}catch{}
 pickerOpen(false);render();
};
const pads=Array.from(shotOptions.querySelectorAll('[data-shot]'),button=>{
 const name=button.dataset.shot;
 button.onclick=()=>{shot=name;newShots.delete(name);pickerOpen(false,true);render();draw();};
 return [name,button];
});
function renderShotPad(){
 const label=pads.find(([name])=>name===shot)?.[1].textContent||'Standard';
 shotPicker.querySelector('span').textContent=label;
 shotPicker.setAttribute('aria-label','Shot type: '+label);
 shotPicker.disabled=busy||chatBusy;
 if(busy||chatBusy)pickerOpen(false);
 $('.compact-dock').dataset.inputMode=inputMode;
 for(const button of modeButtons){
  button.setAttribute('aria-pressed',String(inputMode===button.dataset.mode));
  button.disabled=busy||chatBusy;
 }
 for(const [name,button] of pads){
  const locked=!config.shots.includes(name);
  button.disabled=locked||busy;
  button.setAttribute('aria-description',locked?'Unavailable in this setup. '+shotDescriptions[name]:shotDescriptions[name]);
  button.setAttribute('aria-pressed',String(shot===name));
  button.classList.toggle('is-new',newShots.has(name));
 }
}

function apply(patch,source){patch=validatePatch(patch);if(patch.shots)patch.shots=withPower(patch.shots);if(['theme','accent','font','corners'].some(k=>Object.hasOwn(patch,k)))setUI({},true);const trace=changeTrace(config,patch,source);const changeRound=Object.hasOwn(patch,'attempts')&&patch.attempts!==config.attempts;const added=(patch.shots||[]).filter(name=>!config.shots.includes(name));config={...config,...patch};for(const name of added)newShots.add(name);if(added.length)shot=added[0];else if(!config.shots.includes(shot))shot='standard';if(changeRound)resetRound();persist();render();draw();const feedback=added.length?`${added.map(n=>n[0].toUpperCase()+n.slice(1)).join(' + ')} unlocked. Ready to shoot.`:describePatch(patch);if(feedback){$('#change-feedback').hidden=false;$('#change-feedback').textContent=feedback;clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{$('#change-feedback').hidden=true;},6000);}return {summary:describePatch(patch)+(changeRound?' · New round started':''),trace};}
function updateComposer(){renderComposer({busy,chatBusy,aiReady,onSend:sendPrompt,presetMode:offlineAvailable(),canSend:canSendPrompt,ideaPreview,ideaComplete,onUseIdea:useIdea,models:modelChoices,onModelChange:key=>{selectedModel=key;}});}
let evidenceRun=0;
async function updateEvidence(){return;
 const revision=++evidenceRun,objects={};const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
 for(const [id,obj]of Object.entries(generatedLayers)){const c=currentArt.cache?.[id];objects[id]={layer:obj.layer,repair:currentArt.repairs?.[id]||null,codeHash:await hash(new TextEncoder().encode(obj.code)),pixelHash:c?await hash(c.getContext('2d').getImageData(0,0,c.width,c.height).data):null};}
 if(revision!==evidenceRun)return;
 let box=document.getElementById('review-evidence');if(!box){box=document.createElement('details');box.id='review-evidence';const label=document.createElement('summary');label.textContent='QA evidence';box.append(label,document.createElement('pre'));document.querySelector('.game-panel').append(box);}
 box.querySelector('pre').textContent=JSON.stringify({objects,config,goals:round.filter(r=>r==='goal').length,remaining:config.attempts-round.length},null,2);
}
function renderRoundHud(){
 const attempted=round.length,total=config.attempts,goals=round.filter(outcome=>outcome==='goal').length;
 const score=goals+' / '+total,remaining=String(Math.max(0,total-attempted));
 if($('#score').textContent!==score)$('#score').textContent=score;
 if($('#remaining').textContent!==remaining)$('#remaining').textContent=remaining;
 const dots=$('#round-dots');
 const key=total+':'+round.join(',');
 if(dots.dataset.round===key)return;
 dots.dataset.round=key;
 const labels={goal:'Goal',save:'Saved',miss:'Missed',woodwork:'Woodwork'};
 dots.replaceChildren(...Array.from({length:total},(_,index)=>{
  const outcome=round[index];
  const dot=document.createElement('i');
  const label=labels[outcome]||(outcome?'No goal':'Remaining');
  dot.className=outcome?(outcome==='goal'?'goal':'non-goal'):'';
  dot.setAttribute('role','listitem');
  dot.setAttribute('aria-label','Kick '+(index+1)+': '+label);
  dot.title=label;
  if(outcome)dot.innerHTML='<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+(outcome==='goal'?'M3.5 8.5 6.5 11.5 12.5 5.5':'M5 5l6 6m0-6-6 6')+'"/></svg>';
  return dot;
 }));
}
function render(){updateEvidence().catch(()=>{});document.body.dataset.pitchLook=config.pitch;for(const key of ['theme','accent','font','corners','chatSide'])document.body.dataset[key]=config[key];renderShotPad();for(const b of document.querySelectorAll('[data-aim]')){b.setAttribute('aria-pressed',String(b.dataset.aim===aim));b.disabled=busy;}renderRoundHud();$('#streak-wrap').hidden=!config.showStreak;$('#streak').textContent=streak;$('#shoot').disabled=busy||chatBusy||round.length>=config.attempts;$('#restart').disabled=busy||chatBusy;$('#reset-settings').disabled=busy||chatBusy;$('#clear-chat').disabled=busy||chatBusy;updateComposer();renderSling({inputMode,disabled:busy||chatBusy||round.length>=config.attempts,aim,onAim:direction=>{if(busy||chatBusy||round.length>=config.attempts)return;aim=direction;render();draw();},onSend:()=>$('#shoot').click()});refreshIdea();}
const ideaMotion=matchMedia('(prefers-reduced-motion: reduce)');
const ideaHost=$('#composer-react');
let ideaPool, ideaIndex=0, ideaTimer, ideaPreview='', ideaComplete=false;
let ideaDismissed=false, ideaComposing=false, draftInputRevision=0;
const ideaSeenKey='penalties-accepted-ideas-v1';
function storedIdeas(){
 try{const value=JSON.parse(localStorage.getItem(ideaSeenKey)||'[]');return Array.isArray(value)?value.filter(text=>typeof text==='string'):[];}
 catch{return [];}
}
const seenIdeas=new Set(storedIdeas());
function syncSeenIdeas(){for(const text of storedIdeas())seenIdeas.add(text);}
window.addEventListener('storage',event=>{
 if(event.key!==ideaSeenKey)return;
 syncSeenIdeas();
 if(ideaPool&&seenIdeas.has(ideaPool[ideaIndex])){hideIdea();refreshIdea();}
});
const firstOfflineIdea='Make the ball pink';
const offlineIdeas=[firstOfflineIdea,...[...offlinePresets.keys()].filter(text=>text!==firstOfflineIdea)];
const canSendPrompt=text=>aiReady||offlinePresets.has(text);
const offlineAvailable=()=>!aiReady&&$('#connection').dataset.state==='unavailable';
function ideaInput(){
 const field=$('#prompt');
 return field&&!chatBusy&&!field.disabled&&!field.readOnly&&!field.value&&!ideaComposing&&field.placeholder!=='Listening…'
  ?field:null;
}
function hideIdea(){
 clearTimeout(ideaTimer);
 ideaTimer=undefined;
 if(!ideaPreview)return;
 ideaPreview='';
 ideaComplete=false;
 updateComposer();
}
function advanceIdea(){
 clearTimeout(ideaTimer);
 if(ideaMotion.matches)return;
 ideaTimer=setTimeout(()=>{
  ideaTimer=undefined;
  const field=ideaInput();
  if(!field||document.activeElement===field)return;
  ideaIndex=(ideaIndex+1)%ideaPool.length;
  animateIdea();
 },6500);
}
function animateIdea(){
 if(!ideaPool?.length)return;
 let remaining=ideaPool.length;
 while(remaining&&seenIdeas.has(ideaPool[ideaIndex])){
  ideaIndex=(ideaIndex+1)%ideaPool.length;
  remaining--;
 }
 if(!remaining)return;
 const text=ideaPool[ideaIndex];
 const limit=43;
 const display=text.length>limit?text.slice(0,limit-1).replace(/\s+\S*$/,'').replace(/[,:;]$/,'')+'…':text;
 let count=0;
 function tick(){
  ideaTimer=undefined;
  const field=ideaInput();
  if(!field||ideaDismissed){hideIdea();return;}
  count=ideaMotion.matches?display.length:Math.min(display.length,count+3);
  ideaComplete=count===display.length;
  ideaPreview=display.slice(0,count);
  updateComposer();
  if(!ideaComplete)ideaTimer=setTimeout(tick,44);
  else if(document.activeElement!==field)advanceIdea();
 }
 tick();
}
function refreshIdea(){
 const pool=aiReady?liveIdeas:offlineAvailable()?offlineIdeas:null;
 if(pool!==ideaPool){hideIdea();ideaPool=pool;ideaIndex=0;ideaDismissed=false;}
 if(!ideaInput()){hideIdea();return;}
 if(ideaPool&&!ideaDismissed&&!ideaPreview)animateIdea();
}
function useIdea(){
 const field=ideaInput();
 if(!field||!ideaComplete)return false;
 const text=ideaPool[ideaIndex];
 syncSeenIdeas();
 if(seenIdeas.has(text)){hideIdea();refreshIdea();return false;}
 seenIdeas.add(text);
 try{localStorage.setItem(ideaSeenKey,JSON.stringify([...seenIdeas]));}catch{}
 hideIdea();
 recoverComposer(text);
 field.focus({preventScroll:true});
 return true;
}
ideaHost.addEventListener('focusin',event=>{
 if(event.target.id!=='prompt')return;
 if(ideaComplete){clearTimeout(ideaTimer);ideaTimer=undefined;}
 ideaDismissed=false;
 refreshIdea();
});
ideaHost.addEventListener('focusout',event=>{
 if(event.target.id==='prompt'&&ideaComplete)advanceIdea();
});
ideaHost.addEventListener('input',event=>{
 if(event.target.id!=='prompt')return;
 draftInputRevision++;
 clearTimeout(ideaTimer);
 ideaTimer=undefined;
 // Let the controlled composer commit the input before repainting the placeholder.
 setTimeout(()=>{
  if(event.target.value)hideIdea();
  else if(!ideaComposing){ideaDismissed=false;refreshIdea();}
 });
});
ideaHost.addEventListener('compositionstart',event=>{
 if(event.target.id!=='prompt')return;
 ideaComposing=true;
 hideIdea();
});
ideaHost.addEventListener('compositionend',event=>{
 if(event.target.id!=='prompt')return;
 ideaComposing=false;
 queueMicrotask(refreshIdea);
});
ideaHost.addEventListener('keydown',event=>{
 if(event.target.id!=='prompt'||event.isComposing||event.keyCode===229||ideaComposing||
    event.target.value||event.target.readOnly||$('#chat-form .prompt-bar__menu'))return;
 if(event.key==='Escape'&&ideaPreview){
  event.preventDefault();
  ideaDismissed=true;
  hideIdea();
 }else if(event.key==='Tab'&&!event.shiftKey&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.repeat&&useIdea()){
  event.preventDefault();
 }
},true);
ideaMotion.addEventListener('change',()=>{
 if(!ideaPreview)return;
 hideIdea();
 refreshIdea();
});
function sendPrompt(text,options){
 if(aiReady){const last=history.at(-1);return request(text,options,last?.failed&&last.prompt===text.trim()?last:null);}
 const patch=offlinePresets.get(text);
 if(!offlineAvailable()||busy||chatBusy||!patch)return;
 message('user',text);
 const merged={...patch};
 if(merged.shots)merged.shots=[...new Set([...config.shots,...merged.shots])];
 const applied=apply(merged,'preset');
 message('assistant','Applied a preset change. No AI request was made.',applied.summary,'',applied.trace);
 queueMicrotask(refreshIdea);
}
async function request(prompt,options,retry=null){
 if(busy||chatBusy||!prompt.trim()||!aiReady)return;
 const preserveDraft=Boolean(retry&&$('#prompt').value.trim()&&$('#prompt').value.trim()!==prompt.trim());
 const previousRevision=codeRevisions.at(-1);
 const revisionAtSend=draftInputRevision;
 chatBusy=true;clearFieldGenerationTiming();
 if(!retry)message('user',prompt.trim());
 const entry=Object.assign(retry||{},{role:'assistant',prompt:prompt.trim(),text:'Generating your game change…',changes:'',time:'',trace:null,code:'',generating:true,failed:false,usage:null,generationTime:''});
 if(!retry){history.push(entry);history=history.slice(-40);}
 studioRenderedEntry=null;studioTiming={entry};renderHistory();
 if(!preserveDraft)clearComposer();
 render();let reader;
 try{
  const res=await fetch('/penalties/api/change',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt.trim(),model:options?.model?.key||selectedModel,promptNotice:"2026-11-17",config,previousUI:customUI,objects:generatedLayers,scopedArtVersion:SCOPED_ART_VERSION,ballArtVersion:1,sceneEditVersion:1,sceneCrowdVersion:1,sceneStandVersion:1,scopedArtwork,crowdVersion:CROWD_VERSION,crowdMixVersion:CROWD_MIX_VERSION,crowdArtwork,atmosphereVersion:ATMOSPHERE_VERSION}),signal:AbortSignal.timeout(65000)});
  if(!res.ok){let detail;try{if(res.headers.get('Content-Type')?.includes('application/json'))detail=(await res.json()).error;}catch{}throw Error(detail||'The server could not finish this request (HTTP '+res.status+'). Nothing changed. Please try again.');}
  if(!res.headers.get('Content-Type')?.includes('text/event-stream'))throw Error('The server did not return a live stream. Nothing changed.');
  reader=res.body.getReader();const decoder=new TextDecoder();let pending='',completed=null;
  const consume=block=>{const lines=block.split('\n'),event=lines.find(l=>l.startsWith('event:'))?.slice(6).trim();const raw=lines.filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trim()).join('\n');if(!raw)return;const data=JSON.parse(raw);if(event==='delta'){entry.code+=data.text;if(entry.code.length>16000)throw Error('Output was too large. Nothing changed.');renderHistory();}else if(event==='usage')entry.usage=data;else if(event==='done')completed=data;else if(event==='error')throw Error(data.error);};
  while(true){const {done,value}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true}).replace(/\r\n/g,'\n');if(pending.length>262144)throw Error('Stream too large. Nothing changed.');let idx;while((idx=pending.indexOf('\n\n'))>=0){consume(pending.slice(0,idx));pending=pending.slice(idx+2);}}
  pending+=decoder.decode();if(pending.trim())consume(pending);if(!completed)throw Error('Generation was interrupted. Nothing changed.');const timing=res.headers.get('X-Generation-Ms');
  const generationMs=timing!==null&&/^\d+$/.test(timing)?Number(timing):NaN;
  if(completed.standFinish&&!completed.sceneScope){
   if(Object.keys(completed).some(k=>!['standFinish','message'].includes(k)))throw Error('Conflicting stand finish.');
   const next=validateStandFinish(completed.standFinish),prior=atmosphereArtwork;
   if(JSON.stringify(next)===JSON.stringify(prior.standFinish))throw Error('The stand finish is unchanged.');
   atmosphereArtwork={...prior,standFinish:next};
   try{draw();}catch(error){atmosphereArtwork=prior;draw();throw error;}
   codeRevisions.push({crowd:crowdArtwork,atmosphere:prior,art:currentArt,layers:generatedLayers,ui:structuredClone(customUI),config:structuredClone(config),scoped:scopedArtwork});
   codeRevisions=codeRevisions.slice(-8);$('#undo-code').hidden=false;
   entry.code=JSON.stringify(next);entry.text='Changed the stand finish.';entry.changes='Changed: Stands';
  }else if(completed.crowd&&!completed.sceneScope){
   if(Object.keys(completed).some(key=>!['crowd','message'].includes(key))||routeCrowd(prompt)?.kind!=='crowd')throw Error('Crowd artwork was not requested.');
   const next=validateCrowdRecipe(completed.crowd),prior=crowdArtwork;
   if(JSON.stringify(next)===JSON.stringify(prior))throw Error('The crowd already looks that way.');
   await prepareCrowdSvg(next);
   crowdArtwork=next;
   try{draw();}catch(error){crowdArtwork=prior;draw();throw error;}
   codeRevisions.push({crowd:prior,atmosphere:atmosphereArtwork,art:currentArt,layers:structuredClone(generatedLayers),ui:structuredClone(customUI),config:structuredClone(config),scoped:scopedArtwork});
   codeRevisions=codeRevisions.slice(-8);$('#undo-code').hidden=false;
   entry.code=JSON.stringify(next);entry.text='Updated the crowd.';entry.changes='Changed: Crowd';
  }else if(completed.atmosphere){
   if(Object.keys(completed).some(key=>!['atmosphere','message'].includes(key)))throw Error('Conflicting atmosphere artwork.');
   const edit=validateAtmosphereReply(completed.atmosphere,routeAtmosphere(prompt,generatedLayers));
   const {target,recipe}=edit,prior=atmosphereArtwork;
   if(JSON.stringify(prior[target])===JSON.stringify(recipe))throw Error('Atmosphere already looks that way.');
   atmosphereArtwork={...prior,[target]:recipe};
   try{draw();}catch(error){atmosphereArtwork=prior;draw();throw error;}
   codeRevisions.push({crowd:crowdArtwork,atmosphere:prior,art:currentArt,layers:structuredClone(generatedLayers),ui:structuredClone(customUI),config:structuredClone(config),scoped:scopedArtwork});
   codeRevisions=codeRevisions.slice(-8);$('#undo-code').hidden=false;
   entry.code=JSON.stringify(edit);entry.text='Applied atmosphere artwork.';entry.changes='Changed: '+target;
  }else if(completed.bounded){
   if(Object.keys(completed).some(key=>!['bounded','message'].includes(key)))throw Error('Conflicting scoped artwork.');
   const route=routeBallPrompt(prompt)||routeScopedPrompt(prompt);
   if(!route||route.target==='crowd')throw Error('Scoped artwork target was not requested.');
   ensureScopedCompatible(route,config,generatedLayers);
   const edit=validateScopedEdit(completed.bounded,route);
   const next=mergeScopedEdit(scopedArtwork,edit);
   const prior=scopedArtwork;
   scopedArtwork=next;
   try{draw();}catch(error){scopedArtwork=prior;draw();throw error;}
   codeRevisions.push({crowd:crowdArtwork,atmosphere:atmosphereArtwork,art:currentArt,layers:structuredClone(generatedLayers),ui:structuredClone(customUI),config:structuredClone(config),scoped:prior});
   codeRevisions=codeRevisions.slice(-8);
   $('#undo-code').hidden=false;
   entry.code=JSON.stringify(edit);entry.text='Applied scoped artwork.';entry.changes='Changed: '+edit.target+' '+edit.part;
  }else if(completed.art&&completed.sceneScope){
   const mode=completed.sceneScope;
   const prop=mode==='left'||mode==='right';
   const whole=['whole','whole-crowd','whole-stands','whole-crowd-stands'].includes(mode),withCrowd=mode.includes('-crowd'),withStands=mode.endsWith('-stands');
   if(!prop&&!whole&&mode!=='background')throw Error('Unknown scene scope.');
   if(Object.hasOwn(completed,'crowd')!==withCrowd)throw Error('Incomplete scene crowd artwork.');
   if(Object.hasOwn(completed,'standFinish')!==withStands)throw Error('Incomplete scene stand finish.');
   const nextStandFinish=withStands?validateStandFinish(completed.standFinish):atmosphereArtwork.standFinish;
   if(withStands&&JSON.stringify(nextStandFinish)===JSON.stringify(atmosphereArtwork.standFinish))throw Error('The stand finish is unchanged.');
   const nextCrowd=withCrowd?validateCrowdRecipe(completed.crowd):crowdArtwork;
   if(withCrowd)await prepareCrowdSvg(nextCrowd);
   const prior={crowd:crowdArtwork,atmosphere:atmosphereArtwork,art:currentArt,layers:generatedLayers,ui:structuredClone(customUI),config:structuredClone(config),scoped:scopedArtwork};
   const allowed=prop?['scenery']:['sky','skyline','scenery',...(whole?['pitch']:[])];
   if(completed.art.edits.some(e=>!allowed.includes(e.layer))||completed.art.remove.some(id=>!allowed.includes(generatedLayers[id]?.layer)))throw Error('Scene artwork cannot edit protected objects.');
   const staged=await stageArt(generatedLayers,completed.art,generatedInput('render'),undefined,currentArt);
   if(prop){
    const item=completed.art.edits[0],probe=staged.cache[item?.id];
    if(!probe||completed.art.edits.length!==1||completed.art.remove.length||Object.hasOwn(generatedLayers,item.id))throw Error('A side prop must be new.');
    const edge=mode==='left'?260:0,width=740;
    const {data}=probe.getContext('2d').getImageData(edge,190,width,110);
    for(let i=3;i<data.length;i+=4)if(data[i]>8)throw Error('The prop must stay on the '+mode+'. Nothing changed.');
   }
   if(!prop){const {sky,skyline,scenery,...keep}=atmosphereArtwork;atmosphereArtwork=withStands?{...keep,standFinish:nextStandFinish}:keep;}
   generatedLayers=staged.registry;currentArt=staged;crowdArtwork=nextCrowd;
   try{draw();}catch(error){generatedLayers=prior.layers;currentArt=prior.art;atmosphereArtwork=prior.atmosphere;crowdArtwork=prior.crowd;draw();throw error;}
   codeRevisions.push(prior);codeRevisions=codeRevisions.slice(-8);$('#undo-code').hidden=false;entry.code=JSON.stringify(withCrowd||withStands?{art:completed.art,...(withCrowd?{crowd:nextCrowd}:{}),...(withStands?{standFinish:nextStandFinish}:{})}:completed.art);
   entry.text=withStands?(withCrowd?'Changed the background, pitch, stands and crowd.':'Changed the background, pitch and stands.'):withCrowd?'Changed the background, pitch and crowd.':prop?'Added a side prop.':mode==='whole'?'Changed the background and pitch.':'Changed the background. Pitch kept.';
   entry.changes=withStands?(withCrowd?'Changed: Background, pitch, stands and crowd':'Changed: Background, pitch and stands'):withCrowd?'Changed: Background, pitch and crowd':prop?'Changed: Side prop':mode==='whole'?'Changed: Background and pitch':'Changed: Background';
  }
else if(completed.art){if(completed.art.edits.some(e=>e.layer==='crowd'||e.id==='crowd')||completed.art.remove.includes('crowd'))throw Error('Use the dedicated crowd editor.');const staged=await stageArt(generatedLayers,completed.art,generatedInput('render'),undefined,currentArt);codeRevisions.push({crowd:crowdArtwork,atmosphere:atmosphereArtwork,art:currentArt,layers:structuredClone(generatedLayers),ui:structuredClone(customUI),config:structuredClone(config),scoped:scopedArtwork});codeRevisions=codeRevisions.slice(-8);if(completed.art.edits.some(e=>e.layer==='ball')||completed.art.remove.some(id=>generatedLayers[id]?.layer==='ball')){scopedArtwork={...scopedArtwork};delete scopedArtwork['ball:full'];}generatedLayers=staged.registry;currentArt=staged;entry.code=JSON.stringify(completed.art);draw();$('#undo-code').hidden=false;entry.text='Applied your new change. Other objects kept.';entry.changes='Changed: '+[...completed.art.edits.map(e=>e.id),...completed.art.remove.map(id=>'removed '+id)].join(' · ');}else if(completed.ui){codeRevisions.push({crowd:crowdArtwork,atmosphere:atmosphereArtwork,art:currentArt,code:generatedCode,layers:{...generatedLayers},state:structuredClone(generatedState),ui:structuredClone(customUI),config:structuredClone(config),targets:[...generatedTargets]});codeRevisions=codeRevisions.slice(-8);setUI(completed.ui);$('#undo-code').hidden=false;entry.text='Applied a newly generated UI design.';entry.changes='Applied: '+Object.keys(completed.ui).join(' · ');}else{if(!Object.keys(completed.patch).some(k=>JSON.stringify(completed.patch[k])!==JSON.stringify(config[k])))throw Error('No settings changed. '+(completed.message||'Try a different request.'));if(Object.keys(completed.patch).length){codeRevisions.push({crowd:crowdArtwork,atmosphere:atmosphereArtwork,art:currentArt,code:generatedCode,layers:{...generatedLayers},state:structuredClone(generatedState),ui:structuredClone(customUI),config:structuredClone(config),targets:[...generatedTargets]});codeRevisions=codeRevisions.slice(-8);$('#undo-code').hidden=false;}const applied=apply(completed.patch,'qwen');entry.text=applied.summary?'Applied to your game.':completed.message||'No settings changed.';entry.changes=applied.summary;entry.trace=applied.trace;}await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));if(Number.isFinite(generationMs)){const seconds=studioSeconds(generationMs);entry.generationTime='Generated in '+seconds;if(entry.changes)showFieldGenerationTiming(seconds);}updateStudioTiming('ready');
  const revision=codeRevisions.at(-1);if(revision&&revision!==previousRevision)revision.studioEntry=entry;
 }catch(e){if(!preserveDraft&&draftInputRevision===revisionAtSend&&!$('#prompt').value)recoverComposer(prompt);entry.failed=true;entry.text=e.name==='TimeoutError'?'The request timed out. Nothing was applied.':e.message;updateStudioTiming('failed');}
 finally{try{await reader?.cancel();reader?.releaseLock();}catch{}if(entry.usage)entry.time=(modelChoices.find(m=>m.key===selectedModel)?.name||'Kimi K3.1 Pro')+' · '+entry.usage.inputTokens+' input / '+entry.usage.outputTokens+' output tokens';entry.generating=false;chatBusy=false;
 if(!entry.failed&&!preserveDraft){const picker=$('.studio-target-picker');if(picker)picker.value=picker.dataset.previous='';}
 persist();renderHistory();render();}
}
$('#clear-chat').onclick=()=>{if(busy||chatBusy)return;history=[];persist();renderHistory();};$('#undo-code').onclick=async()=>{if(busy||chatBusy||!codeRevisions.length)return;chatBusy=true;clearFieldGenerationTiming();render();const prior=codeRevisions.at(-1);try{const objs=prior.layers||{};const staged=prior.art||{};currentArt=staged;generatedLayers=objs;if(prior.scoped)scopedArtwork=prior.scoped;if(prior.atmosphere)atmosphereArtwork=prior.atmosphere;crowdArtwork=prior.crowd??null;setUI(prior.ui||{},true);if(prior.config){const changedAttempts=config.attempts!==prior.config.attempts;config=liveSettings(validatePatch(prior.config));if(!config.shots.includes(shot))shot='standard';if(changedAttempts)resetRound();}codeRevisions.pop();$('#undo-code').hidden=!codeRevisions.length;message('assistant','Undid the last applied change.');}catch(e){message('assistant',e.message);}finally{chatBusy=false;render();draw();}};
$('#reset-settings').onclick=()=>{if(busy||chatBusy)return;clearFieldGenerationTiming();setUI({},true);currentArt={};scopedArtwork={};atmosphereArtwork={};crowdArtwork=null;generatedCode='';generatedLayers={};generatedTargets=[];generatedState={};generatedKeeper=null;generatedPitch=null;generatedBall=null;generatedScene=null;codeRevisions=[];clearGenerated();$('#undo-code').hidden=true;newShots.clear();const applied=apply(liveSettings(),'reset');shot='standard';resetRound();message('assistant','Restored the original game settings. A fresh round of five attempts is ready.','','',applied.trace);persist();render();draw();};
function resetRound(){firstGame.beginRound();$('#round-summary').hidden=true;round=[];streak=0;$('#result').textContent='Pick your corner.';delete $('#result').dataset.outcome;render();draw();}
$('#restart').onclick=resetRound;$('#play-again').onclick=resetRound;for(const b of document.querySelectorAll('[data-aim]'))b.onclick=()=>{aim=b.dataset.aim;render();draw();};
$('#shoot').onclick=async()=>{if(busy||chatBusy||round.length>=config.attempts)return;busy=true;newShots.delete(shot);const outcome=firstGame.outcome(takeShot(shot,aim,config.difficulty));$('#result').textContent=shot==='power'?'Let it fly.':shot==='chip'?'A little touch…':'Here we go.';render();sfx.play(['power','finesse','chip'].includes(shot)?shot:'shot');const start=performance.now();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const duration=reduced?160:({standard:950,chip:1450,finesse:1200,'low driven':800,power:1000/config.powerSpeed,trivela:1250}[shot]);function frame(now){const t=Math.min(1,(now-start)/duration);draw({t,...outcome,reduced});if(t<1)requestAnimationFrame(frame);else{round.push(outcome.result);streak=outcome.result==='goal'?streak+1:0;busy=false;const done=round.length>=config.attempts;sfx.play(outcome.result);if(done){firstGame.completeRound(round,config.attempts);sfx.play('final',.65);const summary=roundSummary(round);$('#round-title').textContent=summary.title;$('#round-score').textContent=`${summary.goals} / ${summary.total}`;$('#round-breakdown').textContent=`${summary.saves} saved · ${summary.misses} missed`;$('#round-summary').hidden=false;}$('#result').textContent=done?`${outcomeLabel(outcome.result,outcome.aim)} ${round.filter(x=>x==='goal').length} / ${config.attempts} this round.`:outcomeLabel(outcome.result,outcome.aim)+' '+keeperReaction(shot,outcome.result);$('#result').dataset.outcome=outcome.result;render();}}requestAnimationFrame(frame);};
function line(x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function person(x,y,scale,color,angle=0,player=false,kick=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.strokeStyle='#17231c';ctx.lineCap='round';ctx.lineWidth=12;line(-9,-20,-14,12,'#15251b',12);line(9,-20,player?16+kick*24:14,player?12-kick*22:12,'#15251b',12);line(-14,12,-22,14,'#eeeece',7);line(player?16+kick*24:14,player?12-kick*22:12,player?24+kick*24:22,player?14-kick*22:14,'#eeeece',7);ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(-20,-68,40,50,8);ctx.fill();line(-19,-59,-38,-35,color,11);line(19,-59,38,-35,color,11);if(!player){ctx.fillStyle='#e5ede0';for(const xx of [-39,39]){ctx.beginPath();ctx.arc(xx,-33,7,0,Math.PI*2);ctx.fill();}}ctx.fillStyle='#cda17d';ctx.beginPath();ctx.arc(0,-84,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#292d27';ctx.beginPath();ctx.arc(0,-89,13,Math.PI,Math.PI*2);ctx.fill();if(player){ctx.fillStyle='#e8f0e7';ctx.font='bold 19px sans-serif';ctx.textAlign='center';ctx.fillText('10',0,-35);}ctx.restore();}
// Original canvas dinosaur, sharing the same wind-up and kick timing as the human.
function dinosaur(x,y,scale,angle=0,kick=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
 ctx.fillStyle='#76c76c';ctx.beginPath();ctx.moveTo(-13,-27);ctx.quadraticCurveTo(-67,-25,-91,-59);ctx.quadraticCurveTo(-62,-8,-7,-11);ctx.fill();
 line(-9,-21,-16,10,'#549c51',14);line(-16,10,-4,12,'#d4dfb0',8);
 line(8,-23,16+kick*24,12-kick*22,'#76c76c',15);line(16+kick*24,12-kick*22,29+kick*24,14-kick*22,'#d4dfb0',8);
 ctx.fillStyle='#76c76c';ctx.beginPath();ctx.ellipse(-2,-42,25,34,-.25,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#b9e98e';ctx.beginPath();ctx.ellipse(7,-37,12,23,-.2,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#76c76c';ctx.beginPath();ctx.roundRect(0,-96,53,37,12);ctx.fill();ctx.beginPath();ctx.ellipse(6,-67,17,22,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#edf6d8';ctx.beginPath();ctx.arc(16,-85,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#152b1c';ctx.beginPath();ctx.arc(18,-85,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(44,-84,2,0,Math.PI*2);ctx.fill();line(24,-70,49,-70,'#284e2b',2);
 line(16,-51,33,-44,'#549c51',6);line(33,-44,38,-49,'#d4dfb0',3);
 ctx.fillStyle='#397c45';for(const [sx,sy] of [[-13,-77],[-22,-62],[-27,-46],[-46,-27],[-63,-37]]){ctx.beginPath();ctx.moveTo(sx,sy+7);ctx.lineTo(sx-9,sy-6);ctx.lineTo(sx+5,sy-2);ctx.fill();}ctx.restore();
}
function drawBackdrop(kind){
 if(kind==='mountains'){for(let i=0;i<7;i++){const x=i*170-60;ctx.fillStyle=i%2?'#5c7e78':'#839f93';ctx.beginPath();ctx.moveTo(x,160);ctx.lineTo(x+110,32+i%3*13);ctx.lineTo(x+230,160);ctx.fill();ctx.fillStyle='#dbe8d9';ctx.beginPath();ctx.moveTo(x+83,65+i%3*13);ctx.lineTo(x+110,32+i%3*13);ctx.lineTo(x+139,67+i%3*13);ctx.fill();}}
 if(kind==='london'){ctx.fillStyle='#97b2a5';for(let i=0;i<20;i++)ctx.fillRect(i*55,95+(i%3)*12,45,65);ctx.fillRect(185,42,28,118);ctx.beginPath();ctx.moveTo(180,43);ctx.lineTo(199,15);ctx.lineTo(218,43);ctx.fill();ctx.fillStyle='#f1db9d';ctx.beginPath();ctx.arc(199,61,9,0,Math.PI*2);ctx.fill();line(199,61,199,55,'#314e45',2);line(199,61,204,63,'#314e45',2);ctx.strokeStyle='#a6c0b4';ctx.lineWidth=3;ctx.beginPath();ctx.arc(820,100,47,0,Math.PI*2);ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;line(820,100,820+Math.cos(a)*47,100+Math.sin(a)*47,'#a6c0b4',1);}line(820,100,795,160,'#a6c0b4',3);line(820,100,845,160,'#a6c0b4',3);}
 if(kind==='space'){ctx.fillStyle='#11172e';ctx.fillRect(0,0,1000,160);ctx.fillStyle='#d5e9ff';for(let i=0;i<65;i++){ctx.beginPath();ctx.arc((i*137)%1000,12+(i*47)%140,i%4===0?2:1,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#c6b0f0';ctx.beginPath();ctx.arc(820,73,33,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f3d4af';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(820,73,53,12,-.3,0,Math.PI*2);ctx.stroke();}
}
const pitchDeck=$('.pitch-deck');
const deckArt=pitchDeck?document.createElement('canvas'):null;
let deckSource;
if(deckArt){
 deckArt.className='pitch-deck-art';deckArt.hidden=true;deckArt.setAttribute('aria-hidden','true');
 pitchDeck.prepend(deckArt);
 if(typeof ResizeObserver==='function'){const size=new ResizeObserver(()=>drawPitchDeck(true));size.observe(pitchDeck);size.observe(canvas);}
 document.addEventListener('fullscreenchange',()=>drawPitchDeck(true));
}
function drawPitchDeck(resize=false){
 if(!deckArt||(!resize&&deckSource===currentArt.pitch))return;
 deckSource=currentArt.pitch;
 deckArt.hidden=!deckSource;
 if(!deckSource)return;
 const {clientWidth:w,clientHeight:h}=pitchDeck;
 const sx=canvas.clientWidth/deckSource.width,sy=canvas.clientHeight/deckSource.height;
 const fullscreen=!!document.fullscreenElement;
 const fitX=fullscreen?Math.min(sx,sy):sx,fitY=fullscreen?fitX:sy;
 if(!w||!h||!fitX||!fitY)return;
 const backingWidth=deckSource.width,backingHeight=Math.ceil(h*backingWidth/w);
 if(deckArt.width!==backingWidth)deckArt.width=backingWidth;
 if(deckArt.height!==backingHeight)deckArt.height=backingHeight;
 const displayWidth=Math.min(backingWidth,deckSource.width*fitX*backingWidth/w);
 const requestedRows=h/fitY,sourceRows=Math.min(requestedRows,310);
 const targetRows=backingHeight*sourceRows/requestedRows,left=(backingWidth-displayWidth)/2;
 const deckCtx=deckArt.getContext('2d');
 deckCtx.clearRect(0,0,backingWidth,backingHeight);
 // Reflect just the opaque staged ground: the very first deck row adjoins the same source row, without nets or markings.
 for(let top=0,i=0;top<backingHeight-1e-6;top+=targetRows,i++){
  deckCtx.save();deckCtx.translate(left,top+(i%2?0:targetRows));deckCtx.scale(1,i%2?1:-1);
  deckCtx.drawImage(deckSource,0,deckSource.height-sourceRows,deckSource.width,sourceRows,0,0,displayWidth,targetRows);
  deckCtx.restore();
 }
}
function draw(anim=null){drawFifa(ctx,{config,anim,art:currentArt,aim,shot,scoped:scopedArtwork,atmosphere:atmosphereArtwork,crowdRecipe:crowdArtwork});drawPitchDeck();}
async function restoreArtwork(){if(!savedArtwork||!Object.keys(savedArtwork).length)return;chatBusy=true;render();try{const registry=validateRegistry(savedArtwork);const staged=await stageArt({}, {edits:Object.values(registry),remove:[]},generatedInput('render'));generatedLayers=staged.registry;currentArt=staged;draw();}catch(e){$('#result').textContent='Saved artwork could not be restored safely. Showing default artwork.';}finally{chatBusy=false;render();}}
renderHistory();render();prepareCrowdSvg(crowdArtwork).catch(()=>{crowdArtwork=null;}).then(()=>{draw();return restoreArtwork();}).then(()=>fetch('/penalties/api/status')).then(r=>r.json()).then(s=>{aiReady=s.ready;document.querySelector('.powered strong').textContent='Powered by '+(s.provider||'Cerebras');if(aiReady)fetch('/penalties/api/models').then(r=>r.json()).then(data=>{if(data.models?.length){modelChoices=data.models;if(!modelChoices.some(m=>m.key===selectedModel&&!m.disabled))selectedModel=modelChoices.find(m=>!m.disabled)?.key||selectedModel;updateComposer();}}).catch(()=>{});$('#connection').dataset.state=aiReady?'connected':'unavailable';$('#connection').textContent=aiReady?'Connected to '+(s.provider||'Cerebras'):'Preview mode · Local preset ideas work without AI.';render();}).catch(()=>{$('#connection').dataset.state='unavailable';$('#connection').textContent='Preview mode · AI is unavailable. Preset changes still work.';render();});
