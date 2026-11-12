export const SHOTS = ['standard','chip','finesse','low driven','power','trivela'];
export const COLORS = {white:'#f4f5ef',pink:'#ff80bc',yellow:'#f6ce57',blue:'#67afff',red:'#f76868',green:'#8ada88',purple:'#ba9aff',black:'#252933',gold:'#d6ae55'};
export const defaults = () => ({shots:['standard'],ballColor:'white',keeperColor:'yellow',goalColor:'white',pitch:'day',difficulty:'normal',attempts:10,powerSpeed:1,showStreak:false,theme:'dark',accent:'lime',font:'sans',corners:'rounded',chatSide:'right',playerCharacter:'human',backdrop:'stadium',crowd:true});
export function validatePatch(p) {
 if(!p||typeof p!=='object'||Array.isArray(p)) throw Error('Invalid change');
 const out={}; for(const [k,v] of Object.entries(p)) {
 if(k==='shots'&&Array.isArray(v)&&v.length&&v.length<=6&&v.every(x=>SHOTS.includes(x))&&v.includes('standard'))out[k]=[...new Set(v)];
 else if(['ballColor','keeperColor','goalColor'].includes(k)&&Object.hasOwn(COLORS,v))out[k]=v;
 else if(k==='backdrop'&&['stadium','mountains','london','space'].includes(v))out[k]=v;
 else if(k==='crowd'&&typeof v==='boolean')out[k]=v;
 else if(k==='playerCharacter'&&['human','dinosaur'].includes(v))out[k]=v;
 else if(k==='pitch'&&['day','night'].includes(v))out[k]=v;
 else if(k==='difficulty'&&['easy','normal','hard'].includes(v))out[k]=v;
 else if(k==='attempts'&&Number.isInteger(v)&&v>=1&&v<=20)out[k]=v;
 else if(k==='powerSpeed'&&[0.75,1,1.5,2].includes(v))out[k]=v;
 else if(k==='theme'&&['dark','light','neon'].includes(v))out[k]=v;
 else if(k==='accent'&&['lime','pink','blue','gold'].includes(v))out[k]=v;
 else if(k==='font'&&['sans','mono'].includes(v))out[k]=v;
 else if(k==='corners'&&['rounded','square'].includes(v))out[k]=v;
 else if(k==='chatSide'&&['left','right'].includes(v))out[k]=v;
 else if(k==='showStreak'&&typeof v==='boolean')out[k]=v;
 else throw Error('Unsupported change');
 } return out;
}
export function takeShot(type,aim,difficulty,rng=Math.random){
 if(!SHOTS.includes(type)||!['left','centre','right'].includes(aim)||!['easy','normal','hard'].includes(difficulty))throw Error('Invalid shot');
 const keeper=['left','centre','right'][Math.floor(rng()*3)];
 const miss={standard:.035,chip:.09,finesse:.045,'low driven':.035,power:.13,trivela:.10}[type];
 const save={standard:.72,chip:.42,finesse:.52,'low driven':.58,power:.35,trivela:.48}[type]*{easy:.65,normal:1,hard:1.25}[difficulty];
 const missed=rng()<miss; const saved=!missed&&keeper===aim&&rng()<save;
 return {keeper,result:missed?'miss':saved?'save':'goal',type,aim};
}
export function describePatch(p){ return Object.entries(p).map(([k,v])=>({shots:`Shots: ${Array.isArray(v)?v.join(', '):v}`,ballColor:`Ball: ${v}`,keeperColor:`Keeper kit: ${v}`,goalColor:`Goalposts: ${v}`,pitch:`Pitch: ${v}`,difficulty:`Keeper: ${v}`,attempts:`Attempts: ${v}`,powerSpeed:`Power speed: ${v}×`,showStreak:`Streak counter: ${v?'on':'off'}`,theme:`Theme: ${v}`,accent:`Accent: ${v}`,font:`Font: ${v}`,corners:`Corners: ${v}`,chatSide:`Chat: ${v}`,playerCharacter:`Penalty taker: ${v}`,backdrop:`Backdrop: ${v}`,crowd:`Crowd: ${v?'on':'off'}`}[k])).join(' · '); }
export function changeTrace(before,patch,source){
 if(!['preset','qwen','reset'].includes(source))throw Error('Invalid change source');
 const safe=validatePatch(patch),prior=validatePatch(before),keys=Object.keys(safe);
 return JSON.parse(JSON.stringify({source,before:Object.fromEntries(keys.map(k=>[k,prior[k]])),patch:safe,after:Object.fromEntries(keys.map(k=>[k,safe[k]]))}));
}

export function powerMotion(progress){
 const t=Math.max(0,Math.min(1,progress));
 return {windup:t<.28?Math.sin(t/.28*Math.PI):0,flight:t<.28?0:(t-.28)/.72};
}

// Shared goal-mouth geometry for the renderer, aim marker and shot paths.
export const GOAL={left:280,right:720,top:175,bottom:301};
export function shotTarget(type,aim,result='goal'){
 if(!SHOTS.includes(type)||!['left','centre','right'].includes(aim)||!['goal','save','miss'].includes(result))throw Error('Invalid trajectory');
 if(result==='miss')return {x:aim==='left'?235:aim==='right'?765:500,y:aim==='centre'?140:255};
 return {x:aim==='left'?330:aim==='right'?670:500,y:type==='low driven'?281:type==='chip'?226:250};
}
export function shotPosition(type,aim,result,progress){
 const t=Math.max(0,Math.min(1,progress)),end=shotTarget(type,aim,result);
 const curve=(type==='finesse'?65:type==='trivela'?-65:0)*Math.sin(Math.PI*t);
 let x=500+(end.x-500)*t+curve,y=468+(end.y-468)*t-(type==='chip'?105:type==='low driven'?0:28)*Math.sin(Math.PI*t);
 if(result==='save'&&t>.85){const bounce=(t-.85)/.15;x+=(aim==='left'?45:aim==='right'?-45:0)*bounce;y+=(340-end.y)*bounce;}
 return {x,y,radius:14-7*t};
}
export function outcomeLabel(result,aim){return result==='goal'?'Goal. Beautiful.':result==='save'?'Saved. Try the other corner.':aim==='centre'?'Missed. Over the bar.':'Missed. Wide of the post.';}
