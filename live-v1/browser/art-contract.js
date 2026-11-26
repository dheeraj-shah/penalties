function scopeObjectText(text){return text.replace(/\b(?:football|soccer|basketball|baseball)\s+(?:(?:goalkeeper|player|team)\s+)?(?:boots?|cleats?|shoes?|jerseys?|shirts?|kits?|uniforms?|caps?|hats?|gloves?|players?|teams?|stadiums?)\b/g,'equipment');}
import {validatePitchTexture} from './pitch-texture.js';
export const ART_LAYERS=Object.freeze(['sky','skyline','stands','crowd','scenery','pitch','keeper','kicker','ball']);
export {ART_BOUNDS} from './camera.js';
const singleton=new Set(['keeper','kicker','pitch','ball','skyline','stands','crowd']);
const bytes=s=>new TextEncoder().encode(s).length;
export function validateArtChange(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid artwork');
 const edits=raw.edits??[],remove=raw.remove??[];
 if(!Array.isArray(edits)||!Array.isArray(remove)||(!edits.length&&!remove.length)||edits.length>16||remove.length>16)throw Error('Invalid artwork edits');
 const seen=new Set();const idOK=id=>typeof id==='string'&&/^[a-z][a-z0-9-]{0,39}$/.test(id);
 for(const e of edits){if(!e||Object.keys(e).some(k=>!['id','layer','code'].includes(k))||!idOK(e.id)||seen.has(e.id)||!ART_LAYERS.includes(e.layer)||singleton.has(e.layer)&&e.id!==e.layer||singleton.has(e.id)&&e.layer!==e.id||typeof e.code!=='string'||!e.code.trim()||bytes(e.code)>10000||e.code.includes('\0'))throw Error('Invalid art object');if(e.layer==='pitch')validatePitchTexture(e.code);seen.add(e.id);}
 for(const id of remove){if(!idOK(id)||seen.has(id))throw Error('Invalid removal');seen.add(id);}
 return {edits:edits.map(e=>({...e})),remove:[...remove]};
}
export function mergeArt(prior,change){
 const {edits,remove}=validateArtChange(change),next={...prior};
 for(const id of remove){if(!Object.hasOwn(next,id))throw Error('Unknown object removal');delete next[id];}
 for(const edit of edits){if(next[edit.id]&&next[edit.id].layer!==edit.layer)throw Error('Cannot change object layer');next[edit.id]={...edit};}
 if(Object.keys(next).length>16||Object.values(next).reduce((n,e)=>n+bytes(e.code),0)>10000)throw Error('Artwork limit exceeded');
 return next;
}
export function validateRegistry(registry){if(!registry||typeof registry!=='object'||Array.isArray(registry))throw Error('Invalid objects');const values=Object.values(registry);if(!values.length)return {};const result=mergeArt({}, {edits:values});for(const [id,obj]of Object.entries(registry))if(obj.id!==id)throw Error('Mismatched ID');return result;}
// Fail closed on ambiguous artwork scope. This limits effects, not model intent.
export function requestedLayers(prompt){
 const s=prompt.toLowerCase().replace(/(?:leave|keep)\s+[^,.!?;]*?(?:unchanged|same|as is)/g,'').replace(/(?:do not|don't|never)\s+(?:change|alter|modify|touch)\s+[^,.!?;]*/g,''),out=new Set();
 if(/\b(goalkeeper|keeper|goalie)\b/.test(s)||(/\b(gloves|hat)\b/.test(s)&&!/\b(taker|kicker|shooter|player)\b/.test(s)))out.add('keeper');
 if(/\b(taker|kicker|shooter|player)\b/.test(s))out.add('kicker');
 if(/\b(ball|football)\b/.test(scopeObjectText(s)))out.add('ball');
 if(/\b(pitch|turf|grass|ground|surface)\b/.test(s))out.add('pitch');
 if(/\b(sky|rainbows?|ufos?|clouds?|suns?|moons?|stars?|spaceships?|snow|rain|weather)\b/.test(s))out.add('sky');
 if(/\b(skyline|mountains|city)\b/.test(s))out.add('skyline');
 if(/\b(stands|stadium)\b/.test(s))out.add('stands');
 if(/\bcrowd\b/.test(s))out.add('crowd');
 if(/\b(background|scenery)\b/.test(s))out.add('scenery');
 return [...out];
}
export function checkArtScope(change,prompt,objects){const allowed=requestedLayers(prompt);for(const e of change.edits)if(!allowed.includes(e.layer))throw Error('Artwork target was not requested');for(const id of change.remove){const obj=objects[id];if(!obj||!allowed.includes(obj.layer)||!prompt.toLowerCase().includes(id.replaceAll('-',' ')))throw Error('Removal was not clearly requested');}return change;}
export function checkPatchScope(patch,prompt){
 const raw=prompt.toLowerCase().trim();
 if(/^(?:please )?(?:reset(?: the game)?|restore (?:the )?original(?: game)?(?: settings)?|start over)[.!]?$/.test(raw))return patch;
 const text=raw.replace(/(?:leave|keep)\s+[^,.!?;]*?(?:unchanged|same|as is)/g,'').replace(/(?:do not|don't|never)\s+(?:change|alter|modify|touch|reset)\s+[^,.!?;]*/g,'');
 const patterns={playerCharacter:/\b(taker|kicker|shooter|player)\b/,keeperColor:/\b(keeper|goalkeeper|goalie)\b/,ballColor:/\b(ball|football)\b/,goalColor:/\b(goalposts?|posts?|frame|goal)\b/,backdrop:/\b(backdrop|background|scenery|stadium|mountains|space|london)\b/,crowd:/\b(crowd|spectators|fans)\b/,pitch:/\b(pitch|night|day|ground|turf)\b/,difficulty:/\b(difficulty|harder|easier|easy|hard)\b/,attempts:/\b(attempts?|round|kicks?|shots?)\b/,shots:/\b(shots?|chip|finesse|trivela|driven|power)\b/,powerSpeed:/\b(power|speed|faster|slower)\b/,showStreak:/\b(streak)\b/,theme:/\b(theme|ui|interface|dark|light|neon)\b/,accent:/\b(accent|buttons?|ui|interface)\b/,font:/\b(font|typeface|typography|monospace)\b/,corners:/\b(corners?|rounded|square)\b/,chatSide:/\b(chat|panel)\b/};
 for(const key of Object.keys(patch))if(!patterns[key]?.test(key==='ballColor'?scopeObjectText(text):text))throw Error('Setting target was not requested');
 // A keeper request cannot silently transform the taker through the generic player alias.
 if(Object.hasOwn(patch,'playerCharacter')&&/\b(keeper|goalkeeper|goalie)\b/.test(text)&&!/\b(taker|kicker|shooter)\b/.test(text))throw Error('Keeper is not the taker');
 return patch;
}
