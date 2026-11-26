// Original synthesized effects: no audio downloads, samples or background loop.
export function soundPlan(name){
 const note=(f,to,d=.12,at=0,v=.09,type='sine')=>({f,to,d,at,v,type});
 switch(name){
 case 'click':return [note(650,480,.035,0,.035)];
 case 'power':return [note(90,42,.22,0,.16,'triangle'),note(320,60,.15,0,.07,'sawtooth')];
 case 'finesse':return [note(420,920,.25,0,.065,'sine'),note(150,65,.12,0,.08,'triangle')];
 case 'chip':return [note(260,630,.19,0,.07,'sine')];
 case 'shot':return [note(160,55,.14,0,.12,'triangle')];
 case 'save':return [note(110,55,.09,0,.13,'triangle'),note(180,95,.08,.07,.05)];
 case 'miss':return [note(330,180,.24,0,.055,'sine')];
 case 'goal':return [note(523,523,.14,0,.075),note(659,659,.15,.1,.075),note(784,784,.23,.2,.075)];
 case 'final':return [note(392,392,.18,0,.07),note(523,523,.18,.14,.07),note(659,659,.18,.28,.07),note(784,784,.3,.42,.07)];
 default:return [];
 }
}
export class GameAudio{
 constructor({createContext,storage}={}){this.createContext=createContext||(()=>new(globalThis.AudioContext||globalThis.webkitAudioContext)());this.storage=storage;this.context=null;this.active=new Set();try{this.muted=storage?.getItem('penalties-muted')==='true';}catch{this.muted=false;}}
 unlock(){if(this.muted)return;try{this.context??=this.createContext();if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch{}}
 setMuted(value){this.muted=!!value;try{this.storage?.setItem('penalties-muted',String(this.muted));}catch{}if(this.muted){for(const o of this.active)try{o.stop();}catch{}this.active.clear();}else this.unlock();}
 play(name,delay=0){const c=this.context;if(this.muted||!c||c.state!=='running')return;for(const n of soundPlan(name)){if(this.active.size>=32)break;try{const o=c.createOscillator(),g=c.createGain(),at=c.currentTime+Math.max(0,Math.min(1,delay))+n.at;o.type=n.type;o.frequency.setValueAtTime(n.f,at);o.frequency.exponentialRampToValueAtTime(n.to,at+n.d);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(n.v,at+.008);g.gain.exponentialRampToValueAtTime(.001,at+n.d);o.connect(g);g.connect(c.destination);this.active.add(o);o.onended=()=>{this.active.delete(o);o.disconnect();g.disconnect();};o.start(at);o.stop(at+n.d+.02);}catch{}}
 }
}
