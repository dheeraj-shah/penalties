export const SHOTS = ['standard','chip','finesse','low driven','power','trivela'];
export const COLORS = {white:'#f4f5ef',pink:'#ff80bc',yellow:'#f6ce57',blue:'#67afff',red:'#f76868',green:'#8ada88',purple:'#ba9aff',black:'#252933',gold:'#d6ae55'};
export const defaults = () => ({shots:['standard'],ballColor:'white',keeperColor:'yellow',goalColor:'white',pitch:'day',difficulty:'normal',attempts:10,powerSpeed:1,showStreak:false});
export function validatePatch(p) {
 if(!p||typeof p!=='object'||Array.isArray(p)) throw Error('Invalid change');
 const out={}; for(const [k,v] of Object.entries(p)) {
 if(k==='shots'&&Array.isArray(v)&&v.length&&v.length<=6&&v.every(x=>SHOTS.includes(x))&&v.includes('standard'))out[k]=[...new Set(v)];
 else if(['ballColor','keeperColor','goalColor'].includes(k)&&Object.hasOwn(COLORS,v))out[k]=v;
 else if(k==='pitch'&&['day','night'].includes(v))out[k]=v;
 else if(k==='difficulty'&&['easy','normal','hard'].includes(v))out[k]=v;
 else if(k==='attempts'&&Number.isInteger(v)&&v>=1&&v<=20)out[k]=v;
 else if(k==='powerSpeed'&&[0.75,1,1.5,2].includes(v))out[k]=v;
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
export function describePatch(p){ return Object.entries(p).map(([k,v])=>({shots:`Shots: ${Array.isArray(v)?v.join(', '):v}`,ballColor:`Ball: ${v}`,keeperColor:`Keeper kit: ${v}`,goalColor:`Goalposts: ${v}`,pitch:`Pitch: ${v}`,difficulty:`Keeper: ${v}`,attempts:`Attempts: ${v}`,powerSpeed:`Power speed: ${v}×`,showStreak:`Streak counter: ${v?'on':'off'}`}[k])).join(' · '); }
