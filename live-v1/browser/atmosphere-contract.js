
export const recipes = Object.freeze({
  sky:['violet-night','copper-dawn','polar-clear','storm-shelf','rose-nebula'],
  weather:['aurora','rain','snow','meteors','embers'],
  skyline:['alpine','spire-city','canyon','harbor','cedar'],
  scenery:['crash-pod','lighthouse','kinetic-arch','radio-dish','paper-lantern'],
  crowd:['scarves','raincoats','pilots','festival','away-end']
});
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const plain=o=>o && (Object.getPrototypeOf(o)===Object.prototype || Object.getPrototypeOf(o)===null);
const hex=/^#[0-9a-fA-F]{6}$/;
const parts={sky:[],weather:['density'],skyline:[],scenery:['side'],crowd:['palette']};

export function validateAtmosphere(target,value){
  if(!own(recipes,target)||!plain(value))throw Error('Choose one atmosphere target and a recipe object.');
  if(Object.keys(value).some(key=>!['style','seed','accent',...parts[target]].includes(key)))
    throw Error('Unexpected recipe field. Only the selected layer may be edited.');
  if(!recipes[target].includes(value.style))throw Error('Unsupported style for '+target+'.');
  const seed=value.seed??1;
  if(!Number.isInteger(seed)||seed<0||seed>9999)throw Error('Seed must be an integer from 0 to 9999.');
  const next={style:value.style,seed};
  if(own(value,'accent')){
    if(typeof value.accent!=='string'||value.accent.length!==7||!hex.test(value.accent))throw Error('Accent must be a six-digit hex color.');
    next.accent=value.accent;
  }
  if(target==='weather'){
    const density=value.density??2;
    if(!Number.isInteger(density)||density<1||density>3)throw Error('Weather density must be 1, 2, or 3.');
    next.density=density;
  }
  if(target==='scenery'){
    const side=value.side??'left';
    if(!['left','right'].includes(side))throw Error('Scenery must stay in a side pocket.');
    next.side=side;
  }
  if(own(value,'palette')){
    if(!Array.isArray(value.palette)||value.palette.length<2||value.palette.length>4||
       value.palette.some(c=>typeof c!=='string'||c.length!==7||!hex.test(c)))throw Error('Crowd palette needs 2 to 4 six-digit hex colors.');
    next.palette=[...value.palette];
  }
  return next;
}

export const ATMOSPHERE_VERSION=1;
const entries={
 sky:/\b(?:violet[ -]night|indigo (?:dusk|sky)|copper (?:dawn|sunrise)|polar[ -](?:sky|clear)|storm[ -]shelf|(?:rose[ -])nebula)\b/i,
 weather:/\b(?:weather|aurora|rain|rainfall|snow|snowflakes?|meteors?|embers|drizzle)\b/i,
 skyline:/\b(?:alpine|spire[ -]city|art[ -]deco (?:city|skyline)|canyon|desert mesas?|harbor|cedar)\b/i,
 scenery:/\b(?:lighthouse|crash(?:ed)?[ -](?:flight[ -])?pod|kinetic arch|(?:research|radio) dish|paper lantern)\b/i
};
const disallowed=/\b(?:goalposts?|keeper|goalkeeper|kicker|taker|ball|pitch|ground|turf|grass|crowd|fans|spectators|stands|score|net|buttons?|shots?|difficulty|reset)\b/i;
export function routeAtmosphere(prompt,objects={}){
 const text=prompt.replace(/(?:leave|keep)\s+[^,.!?;]*?(?:unchanged|same|as is)/gi,'').replace(/(?:do not|don't|never)\s+(?:change|alter|modify|touch)\s+[^,.!?;]*/gi,'').trim();
 if(!/^(?:please\s+)?(?:add|make|set|change|give|draw|apply|put|place|show|replace|turn|create|paint)\b/i.test(text)||disallowed.test(text))return null;
 const hits=Object.keys(entries).filter(k=>entries[k].test(text));
 if(hits.length!==1)return null;
 const target=hits[0], art=Object.values(objects);
 // The fixed lighthouse has a cream tower; only its beam can take an accent.
 if(target==='scenery'&&/\b(?:black|blue|brown|gold|green|grey|gray|orange|pink|purple|red|yellow)\s+lighthouse\b/i.test(text))return null;
 if(target==='skyline'&&art.some(x=>x.layer==='skyline'))return null;
 if(target==='sky'&&art.some(x=>x.layer==='sky'&&['sky','sky-background','background','weather'].includes(x.id)))return null;
 const left=/\b(?:far[ -])?left\b/i.test(text),right=/\b(?:far[ -])?right\b/i.test(text);
 if(target==='scenery'&&left&&right)return null;
 return {target,...(target==='scenery'&&(left||right)?{side:left?'left':'right'}:{})};
}
export function validateStandFinish(value){
 if(!plain(value)||Object.keys(value).length!==3||!['material','base','trim'].every(k=>own(value,k))||
   !['painted','stone','metal'].includes(value.material)||
   ![value.base,value.trim].every(c=>typeof c==='string'&&hex.test(c))||
   value.base.toLowerCase()===value.trim.toLowerCase())throw Error('Invalid stand finish.');
 return {material:value.material,base:value.base.toLowerCase(),trim:value.trim.toLowerCase()};
}
export function validateAtmosphereScene(scene={}){
 if(!plain(scene)||Object.keys(scene).some(k=>k!=='standFinish'&&!own(entries,k)))throw Error('Invalid atmosphere scene.');
 return Object.fromEntries(Object.entries(scene).map(([k,v])=>[k,k==='standFinish'?validateStandFinish(v):validateAtmosphere(k,v)]));
}
const sameKeys=(o,keys)=>plain(o)&&Object.keys(o).length===keys.length&&keys.every(k=>own(o,k));
export function validateAtmosphereReply(payload,route){
 if(!route||!sameKeys(payload,['target','recipe'])||payload.target!==route.target)throw Error('Atmosphere target was not requested.');
 let recipe=payload.recipe;
 if(typeof recipe==='string'&&recipes[route.target].includes(recipe))recipe={style:recipe};
 if(route.side&&plain(recipe)&&!own(recipe,'side'))recipe={...recipe,side:route.side};
 const next=validateAtmosphere(route.target,recipe);
 if(route.side&&next.side!==route.side)throw Error('Atmosphere scenery side was not requested.');
 return {target:route.target,recipe:next};
}
// JSON.parse already verified the syntax. Refuse duplicate keys in this new reply type
// so the model cannot silently substitute a later target or recipe member.
export function assertUniqueRecipeKeys(json){
 const tokens=json.match(/"(?:[^"\\]|\\[\s\S])*"|[{}\[\]:,]/g)||[],stack=[];
 for(let i=0;i<tokens.length;i++){
  const t=tokens[i];
  if(t==='{')stack.push(new Set());
  else if(t==='[')stack.push(null);
  else if(t==='}'||t===']')stack.pop();
  else if(t[0]==='"'&&tokens[i+1]===':'&&stack.at(-1)){
   const key=JSON.parse(t),keys=stack.at(-1);
   if(keys.has(key))throw Error('Duplicate atmosphere field.');
   keys.add(key);
  }
 }
}
const example={
 sky:{style:'violet-night',seed:37},
 weather:{style:'snow',seed:37,density:1},
 skyline:{style:'alpine',seed:37},
 scenery:{style:'lighthouse',seed:37,side:'left'}
};
export function atmosphereInstruction(route){
 const {target,side}=route;
 const recipe={...example[target],...(side?{side}:{})};
 return '\nOptional trusted atmosphere effect for THIS request only. If one of the following '+target+' styles fully fits the requested design, return exactly the JSON envelope shown (no other keys): '+JSON.stringify({atmosphere:{target,recipe},message:'Brief change description.'})+'. Allowed style values: '+recipes[target].join(', ')+'. Optional fields: seed integer 0–9999, accent exact #RRGGBB'+(target==='weather'?', density integer 1–3':target==='scenery'?', side left or right':'')+'. If the requested details, shapes, or placement are not represented by that recipe, use the existing creative edits/patch format instead; do not simplify the request to force a recipe.';
}
