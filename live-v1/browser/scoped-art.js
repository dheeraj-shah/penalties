// This contract is shared by the Worker and browser. It accepts drawing data only.
export const SCOPED_ART_VERSION=1;
const PARTS=['head','neck','torso','arms','gloves','legs','boots'];
export const SCOPED_ROUTES=Object.freeze({
 keeper:Object.freeze(PARTS),
 kicker:PARTS,
 crowd:Object.freeze(['full']),
 ball:Object.freeze(['full'])
});
export const KEEPER_CONTACTS=Object.freeze({
 head:[[0,85]],neck:[[0,-70],[0,65]],torso:[[0,-65],[-69,-76],[69,-76],[0,80]],
 arms:[[80,-80],[-90,94]],gloves:[[18,-12]],legs:[[50,-76],[-12,94]],boots:[[0,-14]]
});
const MAX_SCENE_BYTES=10000;
const MAX_SHAPES=12;
const encodeLength=value=>new TextEncoder().encode(JSON.stringify(value)).length;
const coord=n=>Number.isInteger(n)&&Math.abs(n)<=100;
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
 Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const routeKey=({target,part})=>target+':'+part;

export function paintsAt(shapes,x,y){
 return shapes.some(([kind,,...args])=>{
  if(kind==='ellipse'){
   const [cx,cy,rx,ry]=args;
   return ((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
  }
  // Canvas fills polygons with the non-zero winding rule.
  let winding=0;
  for(let i=0;i<args.length;i++){
   const [ax,ay]=args[i], [bx,by]=args[(i+1)%args.length];
   const side=(bx-ax)*(y-ay)-(by-ay)*(x-ax);
   if(ay<=y&&by>y&&side>0)winding++;
   if(ay>y&&by<=y&&side<0)winding--;
  }
  return winding!==0;
 });
}
const CONTACT_PROBES=[[-5,-5],[-5,0],[-5,5],[0,-5],[0,0],[0,5],[5,-5],[5,0],[5,5]];
export function validateScopedEdit(value,route){
 if(!exact(value,['target','part','shapes'])||!Object.hasOwn(SCOPED_ROUTES,value.target)||
    !SCOPED_ROUTES[value.target].includes(value.part))throw Error('Unsupported scoped artwork.');
 if(route&&(value.target!==route.target||value.part!==route.part))throw Error('Scoped artwork target was not requested.');
 const {target,part,shapes}=value;
 if(!Array.isArray(shapes)||shapes.length<1||shapes.length>MAX_SHAPES)throw Error('Invalid scoped shape count.');
 for(const shape of shapes){
  if(!Array.isArray(shape)||typeof shape[1]!=='string'||!/^#[0-9a-f]{6}$/i.test(shape[1]))throw Error('Invalid scoped shape color.');
  const [kind,,...args]=shape;
  if(kind==='polygon'){
   if(args.length<3||args.length>8||!args.every(pair=>Array.isArray(pair)&&pair.length===2&&pair.every(coord)))
    throw Error('Invalid scoped polygon.');
   const area=args.reduce((sum,[x,y],i)=>{const [a,b]=args[(i+1)%args.length];return sum+x*b-a*y;},0);
   if(!area)throw Error('Empty scoped polygon.');
  }else if(kind==='ellipse'){
   const [x,y,rx,ry]=args;
   if(args.length!==4||!args.every(coord)||rx<5||ry<5||Math.abs(x)+rx>100||Math.abs(y)+ry>100)
    throw Error('Invalid scoped ellipse.');
  }else throw Error('Unsupported scoped shape.');
 }
 if(target==='keeper'&&KEEPER_CONTACTS[part].some(([x,y])=>!CONTACT_PROBES.some(([dx,dy])=>paintsAt(shapes,x+dx,y+dy))))
  throw Error('Keeper artwork must meet its native joints.');
 if(target==='crowd'){
  if(shapes.length<3)throw Error('A full spectator needs at least three shapes.');
  for(const [low,high] of [[-100,-50],[-35,35],[56,100]]){
   let sample=0;
   for(let y=low+4;y<high;y+=4)for(let x=-96;x<100;x+=4)if(paintsAt(shapes,x,y))sample++;
   if(sample<6)throw Error('A full spectator needs visible head, body and legs.');
  }
 }
 return {target,part,shapes};
}

export function validateScopedScene(scene={}){
 if(!scene||typeof scene!=='object'||Array.isArray(scene))throw Error('Invalid scoped scene.');
 const entries=Object.entries(scene);
 if(entries.filter(([key])=>key!=='ball:full').length>15||encodeLength(scene)>MAX_SCENE_BYTES)throw Error('Scoped artwork limit exceeded.');
 for(const [id,item] of entries)if(routeKey(validateScopedEdit(item))!==id)throw Error('Invalid scoped artwork key.');
 return Object.fromEntries(entries);
}

export function mergeScopedEdit(scene,change){
 const art=validateScopedEdit(change);
 return validateScopedScene({...scene,[routeKey(art)]:art});
}

// A scoped operation touches one unambiguous target and one canonical part.
const subject={
 keeper:/\b(?:goalkeeper|keeper|goalie)\b/i,
 kicker:/\b(?:kicker|(?:penalty )?taker|shooter)\b/i,
 crowd:/\b(?:crowd|spectators?|fans?)\b/i
};
const parts={
 head:/\b(?:head|face|eyes?|helmet|goggles?|visor|half-mask)\b/i,
 neck:/\b(?:neck|collar|bow tie|amulet)\b/i,
 torso:/\b(?:torso|jersey|shirt|vest|chest)\b/i,
 arms:/\b(?:arms?|sleeves?|forearms?|vambraces?)\b/i,
 gloves:/\b(?:gloves?|mitts?|mittens?|hands?|knuckles?)\b/i,
 legs:/\b(?:legs?|trousers|knees?|shins?)\b/i,
 boots:/\b(?:boots?|cleats?|shoes?|slippers?)\b/i
};
const otherScope=/\b(?:ball|pitch|turf|skyline|sky|stands|weather|net|goalposts?|scoreboard|difficulty|attempts?|fullscreen|buttons|interface|power|shoot|physics|hitboxes)\b/i;
// Single visual ball commands only. Preset color, mixed requests and gameplay stay on their original path.
const ballSubject=String.raw`(?:soccer ball|football|ball)`;
const ballColors=String.raw`(?:white|pink|yellow|blue|red|green|purple|black|gold)`;
const ballVerb=String.raw`(?:change|make|turn|transform|replace|redraw|draw|style|restyle|paint|color|colour|give|design)`;
const ballFirst=new RegExp(String.raw`^(?:(?:can|could|would)\s+you\s+)?(?:please\s+)?${ballVerb}\s+(?:(?:the|my|our)\s+)?${ballSubject}\b\s*(.*)$`,'i');
const presetBall=new RegExp(String.raw`^(?:(?:can|could|would)\s+you\s+)?(?:please\s+)?(?:make|paint|change|color|colour|set|give)\s+(?:(?:the|my|our|a)\s+)?(?:${ballSubject}\s+(?:(?:color|colour)\s+)?(?:(?:to|as)\s+)?(?:a\s+)?(?:solid\s+)?${ballColors}(?:\s+(?:color|colour|ball))?|${ballColors}\s+${ballSubject})$`,'i');
const ballMixed=/\b(?:goalkeepers?|keepers?|goalies?|kickers?|takers?|pitch|turf|grass|skyline|sky|stands|weather|net|goalposts?|scoreboard|crowd|spectators?|fans?|difficulty|attempts?|fullscreen|buttons?|interface|physics|hitboxes|bounc(?:e|ier|ing)|speed|trajectory|curve|weight|bigger|smaller|larger|heavier|lighter)\b|\b(?:and|or|then)\s+(?:also\s+)?(?:add|change|turn|remove|replace|make|give|draw|paint|fix|set|alter|reset)\b/i;
export function routeBallPrompt(prompt){
 const command=prompt.replace(/(?:leave|keep)\s+[^,.!?;]*?(?:unchanged|same|as is)/gi,'')
  .replace(/(?:do not|don't|never)\s+(?:change|alter|modify|touch)\s+[^,.!?;]*/gi,'')
  .trim().replace(/^[,\s]+|[,\s.!?]+$/g,'');
 const found=command.match(ballFirst);
 if(!found||!found[1]||presetBall.test(command)||ballMixed.test(found[1])||/[;!?]|\.\s/.test(found[1]))return null;
 if(/^(?:move|reset|revert|back|faster|slower|default|original|normal|classic|standard|to\s+(?:the\s+)?(?:default|original|normal|classic|standard))\b/i.test(found[1]))return null;
 return {target:'ball',part:'full'};
}

export function routeScopedPrompt(prompt){
 const action=prompt.replace(/(?:leave|keep)\s+[^,.!?;]*?(?:unchanged|same|as is)/gi,'')
  .replace(/(?:do not|don't|never)\s+(?:change|alter|modify|touch)\s+[^,.!?;]*/gi,'');
 const command=action.split(/[.!?;](?:\s|$)/,1)[0];
 const targets=Object.keys(subject).filter(target=>subject[target].test(action));
 if(!targets.length&&/\b(?:gloves|goalie gloves)\b/i.test(command))targets.push('keeper');
 if(!targets.length)return null;
 const character=targets.find(target=>target!=='crowd');
 if(character){
  const namedPart=command.split(/\bwith\b/i,1)[0];
  const found=Object.keys(parts).filter(part=>parts[part].test(namedPart));
  if(!found.length)return null;
  // Keep existing simple native color settings on their original path.
  if(/^\s*(?:please\s+)?(?:make|give|paint|change)\b[^,;.!?]{0,50}\b(?:black|blue|gold|green|pink|purple|red|white|yellow)\s+(?:kit|jersey|shirt)\s*$/i.test(command)||
    /^\s*(?:please\s+)?(?:make|paint|change)\b[^,;.!?]{0,55}\b(?:kit|jersey|shirt)\s+(?:to\s+)?(?:black|blue|gold|green|pink|purple|red|white|yellow)\s*$/i.test(command))return null;
  if(targets.length!==1||found.length!==1||otherScope.test(action)||
     /\b(?:and|or)\s+(?:also\s+)?(?:add|change|turn|remove|replace|make|give|draw|paint|fix|set|alter)\b/i.test(action)||
     /\b(?:and|or)\s+(?:(?:their|the)\s+)?(?:head|neck|torso|arms?|gloves?|legs?|boots?)\b/i.test(command)||
     /\b(?:(?:only|just)\s+(?:on\s+)?(?:the\s+)?(?:left|right)|(?:left|right)\s+(?:arm|glove|hand|leg|boot))\b/i.test(action))
   throw Error('Ask for one scoped object or paired character part at a time.');
  return {target:character,part:found[0]};
 }
 if(!/\b(?:replace|transform|turn|make|redraw|dress)\b/i.test(command)||
    (!/\b(?:full|entire|all|whole|row|every|each)\b/i.test(command)&&!(/\b(?:into|as)\b/i.test(command))))return null;
 // Fan-held props belong to the legacy Crowd route unless a full replacement was requested.
 if(/\b(?:caps?|hats?|scarves|banners?|flags?)\b/i.test(command)&&!/\b(?:replace|redraw|transform|turn)\b/i.test(command))return null;
 if(otherScope.test(action)||/\b(?:stands|railings?)\b/i.test(action))throw Error('Ask for the crowd as a single object.');
 return {target:'crowd',part:'full'};
}

export function ensureScopedCompatible(route,config,registry){
 if(route.target!=='ball'&&registry[route.target])throw Error('Restore the native object before applying scoped artwork.');
 if(route.target==='kicker'&&config.playerCharacter!=='human')throw Error('Kicker part edits require the native human kicker.');
 if(route.target==='crowd'&&!config.crowd)throw Error('Show the crowd before applying scoped artwork.');
}

export function scopedMessages(prompt,route){
 const detail=route.target==='ball'
  ? 'Draw ONE centered custom ball replacement as an easily recognized, bold silhouette, using an opaque main shape and a few contrasting large details. No background or detached decorations. Use most of the 200×200 square. The host scales your complete image into the existing fixed ball slot and moves it without changing size, flight or gameplay.'
  : route.target==='keeper'
  ? 'Draw one complete part within its slot. Paired parts repeat mirrored on the right. Cover these native contact points with opaque artwork: '+JSON.stringify(KEEPER_CONTACTS[route.part])+'.'
  : route.target==='kicker'
   ? 'Draw paint or clothing details only. The host clips it to the moving native '+route.part+' geometry and retains the silhouette.'
   : 'Draw ONE complete front-facing spectator, with head in y=-100..-50, body in y=-35..35 and feet in y=56..100. The host repeats the figure across exactly 16 slots in one row.';
 return [{role:'system',content:'You edit one cosmetic part of a penalty game. Return a single JSON object with exactly target, part, shapes. Return no code, strings outside colors and keys, SVG, markdown, URL, explanation, or settings. '+detail+
  ' Use 1–12 shapes in drawing order. Polygon: ["polygon","#rrggbb",[x,y],[x,y],[x,y]] with 3–8 points. Ellipse: ["ellipse","#rrggbb",cx,cy,rx,ry] with radii >=5, fully within the slot. All coordinates and radii are integers in -100..100. Use the smallest artwork satisfying the request. The host owns all gameplay, actors, anchors, and neighboring layers.'},
 {role:'user',content:JSON.stringify({request:prompt,...route})}];
}
