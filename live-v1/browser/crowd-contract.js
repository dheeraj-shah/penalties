export const CROWD_VERSION=3;
export const CROWD_MIX_VERSION=2;
const bodyForms=Object.freeze({seal:/\bseals?\b/i,kangaroo:/\b(?:kangaroos?|joeys?)\b/i});
const humanForm=/\b(?:humans?|people|cheerleaders?|ordinary (?:fans|supporters|spectators)|normal (?:fans|supporters|spectators))\b/i;
const unbuiltForm=/\b(?:animals?|non[ -]?human|creatures?|cats?|dogs?|foxes?|wolves?|otters?|pandas?|bears?|penguins?|dolphins?|sea lions?|whales?|giraffes?|elephants?|zebras?|rabbits?|dragons?|lions?|tigers?|dinosaurs?|robots?|crabs?|sharks?|octopuses?|cows?|birds?|snakes?)\b/i;
export const UNSUPPORTED_CROWD_BODY='That crowd body shape is not supported yet. Try people, seals, or kangaroos. Nothing changed.';
const BODY_KEYS=['human',...Object.keys(bodyForms),'vector','bikini-cast'];
const canWear=/\b(?:[-\w ]+[- ]themed|(?:seals?|kangaroos?|cats?|dogs?|penguins?|animals?|robots?)\s+(?:costumes?|outfits?|masks?|suits?|jerseys?))\b/i;
// Alternate models and older app tabs stay on the legacy single-shape contract unless they opt in.
const transformSubject=/\b(?:make|turn|change|transform|replace|redraw|swap|build|render|draw|create|fill)\s+(?:(?:all|every|the|whole|entire|our|a|an|mixed|varied)\s+)*(?:crowds?|spectators?|fans?|supporters?)\b\s*(?:into|with|to(?: be)?|as|of|become|(?:look )?like)?\s*(.*)/i;
const distinctCast=/\b(?:distinct|different|varying|varied|multiple) (?:named )?(?:characters?|species|silhouettes?|body shapes?|trainer looks?)\b|\b(?:mix of|mixed cast|mixed group|other characters|two middle seats)\b/i;
const properCast=/\b[A-Z][A-Za-z]+(?:[.']|[ -][A-Za-z]+(?:[.']|’s)?)?(?: *, *[A-Z][A-Za-z]+(?:[ -][A-Za-z]+)?)* *(?:and |& *)[A-Z][A-Za-z]+\b/;
const animalList=/\b(?:giraffes?|seals?|kangaroos?|penguins?|robots?|dragons?|cats?|dogs?|rabbits?|whales?|sharks?|crabs?|jellyfish|zebras?|foxes?)\b/gi;
const hasProperCast=s=>properCast.test(s.replace(/,\s+(?=and\b)/gi,' '));
function mixWanted(action){
 const match=action.match(transformSubject);
 if(!match||!match[1])return false;
 const tail=match[1].split(/\b(?:wearing|holding|dressed in|waving|cheering with)\b/i,1)[0];
 if(/^(?:wear|hold|wave|use|keep|sport|carry|look|stand|sit|cheer|jump|dance)\b/i.test(tail)||canWear.test(tail))return false;
 const first=tail.split(/[!?;]/,1)[0],names=first.split(/[.!?;]/).slice(0,2).join(' ');
 const types=new Set([...first.matchAll(animalList)].map(x=>x[0].toLowerCase().replace(/s$/,'')));
 return distinctCast.test(first)||hasProperCast(names)||(types.size>=2&&/\band\b|[,;&]/i.test(first));
}
function namedHumanoidLineup(action){
 const tail=action.match(transformSubject)?.[1]??'';
 if(!tail||[...tail.matchAll(animalList)].length||/\b(?:animals?|nonhuman|non-human|creatures?|monsters?|robots?|mascots?)\b/i.test(tail))return false;
 return /\b(?:trainers?|humanoids?|people|friends?|named characters?|cast|two middle seats|in (?:the )?cent(?:er|re))\b/i.test(tail)||hasProperCast(tail);
}
const bodyIntent=action=>{
 const transform=action.match(/\b(?:make|turn|change|transform|replace|redraw|swap|render|draw|create|fill)\s+(?:(?:all|every|the|whole|entire|our)\s+)*(?:crowds?|spectators?|fans?|supporters?|cheerleaders?)\s+(?:(?:into|with|to(?: be)?|as|become|(?:look )?like)\s+)?(.+)/i);
 if(!transform)return null;
 const tail=transform[1].split(/\b(?:wearing|holding|dressed in|waving|cheering with)\b/i,1)[0].trim();
 // Adjective-only appearance changes (e.g. "Make fans blue") are not shape changes.
 if(!tail||/^(?:wear|hold|wave|use|keep|sport|carry|look|stand|sit|cheer|jump|dance)\b/i.test(tail))return null;
 if(canWear.test(tail))return humanForm.test(tail)?'human':null;
 if(/\b(?:habitat|zoo|aquarium|enclosure)\b/i.test(tail))return 'unsupported';
 const matches=Object.keys(bodyForms).filter(key=>bodyForms[key].test(tail));
 if(matches.length>1)return 'unsupported';
 if(matches.length===1)return matches[0];
 if(humanForm.test(tail))return 'human';
 return unbuiltForm.test(tail)||/\b(?:into|with|as|become|like)\s+/i.test(transform[0].slice(0,-tail.length))?'vector':null;
};
const subject=/\b(?:crowds?|spectators?|fans?|cheerleaders?|supporters?)\b/i;
const otherObject='goalkeepers?|goalies?|keepers?|kickers?|takers?|shooters?|goalposts?|goal net|pitch|turf|field|balls?|skyline|sky|weather|stands|seating|scenery|background|scoreboard|shot types?|difficulty|attempts?|buttons?|interface|physics|hitboxes';
const verbs='add|change|turn|remove|replace|make|give|draw|paint|fix|set|alter|show|hide|transform|dress|recolor|colour|color|put|redraw|swap|style|render';
const startsOther=new RegExp('(?:^|\\b(?:and|or|also|plus|while|then)\\s+|[,;.!?]\\s*)(?:please\\s+)?(?:'+verbs+')\\s+(?:the\\s+|their\\s+|our\\s+|my\\s+)?(?:'+otherObject+')\\b','i');
const coordinated=new RegExp('\\b(?:'+otherObject+')\\b\\s*(?:,|and|or|\\+|&)\\s*(?:the\\s+)?'+subject.source+'|'+subject.source+'\\s*(?:,|and|or|\\+|&)\\s*(?:the\\s+)?(?:'+otherObject+')\\b','i');
const accessory=/\b(?:scarves?|caps?|hats?|helmets?|hoods?|banners?|flags?|pom[\s-]?poms?|signs?|hair|uniforms?|jerseys?|shirts?|goggles?)\b/i;
const propWords=/\b(?:scarves?|banners?|flags?|pom[\s-]?poms?|signs?)\b/i;
const headWords=/\b(?:caps?|hats?|helmets?|hoods?|hair|goggles?|headbands?)\b/i;
const clothingWords=/\b(?:uniforms?|jerseys?|shirts?)\b/i;
const colorWords=/\b(?:colors?|colours?|palette|red|blue|pink|green|yellow|purple|lime|turquoise|teal|cyan|navy|white|black|orange|gold|magenta|violet|brown|gray|grey|bronze|silver|crimson|scarlet|lavender)\b|#[0-9a-f]{6}\b/i;
const relationship=new RegExp('\\b(?:'+otherObject+')\\b\\s+(?:as|into|to become|look like)\\b','i');
const alongside=new RegExp('\\b(?:and|or|plus)\\s+(?:also\\s+)?the\\s+(?:'+otherObject+')\\b','i');
const consequence=new RegExp('\\b(?:and|then|also|while)\\s+(?:it\\s+)?(?:'+verbs+')\\b[^.;!?]{0,44}\\b(?:'+otherObject+')\\b','i');
const affirmative=s=>s.replace(/\b(?:leave|keep)\s+[^,.!?;]*?(?:unchanged|same|as is)\b/gi,'').replace(/\b(?:do not|don't|never)\s+(?:change|alter|modify|touch|make|turn|paint|draw|add|replace|remove)\s+[^,.!?;]*/gi,'').trim();
export function routeCrowd(prompt,{allowMixed=true}={}){
 const action=affirmative(prompt)
  .replace(/\b(?:behind|above|beyond)\s+(?:the\s+)?(?:stands|grandstands?|seating|crowds?|spectators?|fans?|supporters?)\b/gi,'the horizon')
  .replace(/\b(?:stands|grandstands?|seating)\s*(?:,|and|or|\+)\s*(?:the\s+)?(?:crowd|fans|supporters)\b|\b(?:crowd|fans|supporters)\s*(?:,|and|or|\+)\s*(?:the\s+)?(?:stands|grandstands?|seating)\b/gi,'crowd')
  .replace(/\b(?:stands|grandstands?|seating)\b/gi,'crowd');
 if(!subject.test(action)||!new RegExp('\\b(?:'+verbs+')\\b','i').test(action))return null;
 // A different object may mention the fans as decoration or context; never move it into Crowd.
 if(relationship.test(action)&&!coordinated.test(action)&&!consequence.test(action)&&!new RegExp('\\b(?:'+verbs+')\\s+(?:the\\s+)?'+subject.source,'i').test(action))return null;
 if(startsOther.test(action)||coordinated.test(action)||consequence.test(action)||alongside.test(action))return {kind:'ambiguous'};
 if(/^(?:please\s+)?(?:show|enable|restore|hide|disable|remove)\s+(?:the\s+)?(?:crowd|spectators?|fans?|supporters?)\s*[.!]?$/i.test(action))return null;
 const mixed=allowMixed&&mixWanted(action),body=mixed?'vector':bodyIntent(action);
 return {kind:'crowd',...(body?{body}:{}),...(mixed?{mixed:true,...(namedHumanoidLineup(action)?{named:true}:{})}:{}),mode:accessory.test(action)&&!/\b(?:replace|turn|transform|redraw)\b|\binto\b/i.test(action)?'revise':'redesign',
  fields:{head:headWords.test(action),prop:propWords.test(action),uniform:clothingWords.test(action),palette:colorWords.test(action)}};

}
const uniform=['jersey','jacket','dress','robe','armor','workwear','vest','cheer'];
const detail=['plain','band','stripes','checks','chevron','spots','star'];
const head=['hair','cap','hood','helmet','crown','headband','goggles','ears','ghost'];
const prop=['none','scarf','flag','pompom','sign','glow','megaphone','flower'];
const hex=s=>typeof s==='string'&&s.length===7&&/^#[0-9a-f]{6}$/i.test(s);
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
// A shared closed filled-path design, not a document, script or new rendering layer.
// Bounded Canvas/SVG path groups are normalized by their visible sampled extrema, not the artboard.
function segmentSamples(origin,edge){
 if(edge[0]==='L')return [edge.slice(1)];
 const controls=[origin,...Array.from({length:(edge.length-1)/2},(_,i)=>edge.slice(1+i*2,3+i*2))];
 return Array.from({length:16},(_,i)=>{
  const t=(i+1)/16;
  let curve=controls;
  while(curve.length>1)curve=curve.slice(0,-1).map((p,j)=>p.map((n,k)=>n+(curve[j+1][k]-n)*t));
  return curve[0];
 });
}
function outlinePoints(p){
 const points=[p.start];let origin=p.start;
 for(const e of p.edges){points.push(...segmentSamples(origin,e));origin=e.slice(-2);}
 return points;
}
export function crowdShapeBounds(shape){
 const pts=shape.flatMap(outlinePoints);
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 return {minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY};
}
function validateCrowdShape(shape,allowNearEdgeHandles=false){
 const coord=n=>Number.isInteger(n)&&n>=0&&n<=100;
 const lengths={L:3,Q:5,C:7};
 const partColor=c=>c==='kit'||c==='accent'||hex(c);
 if(!Array.isArray(shape)||shape.length<2||shape.length>12)throw Error('Invalid Crowd silhouette.');
 let total=0;
 const paths=shape.map(p=>{
  if(!exact(p,['color','alpha','start','edges'])||!partColor(p.color)||![55,75,100].includes(p.alpha)||
     !Array.isArray(p.start)||p.start.length!==2||!p.start.every(coord)||
     !Array.isArray(p.edges)||p.edges.length<2||p.edges.length>16||(total+=p.edges.length)>100||
     !p.edges.every(e=>Array.isArray(e)&&Object.hasOwn(lengths,e[0])&&e.length===lengths[e[0]]&&e.slice(1).every((n,i,pts)=>coord(n)||(allowNearEdgeHandles&&i<pts.length-2&&Number.isInteger(n)&&n>=-2&&n<=102))))
    throw Error('Invalid Crowd silhouette geometry.');
  const points=outlinePoints(p);
  let area=0;
  points.forEach(([x,y],i)=>{const [a,b]=points[(i+1)%points.length];area+=x*b-y*a;});
  if(Math.abs(area)<4)throw Error('Empty Crowd silhouette part.');
  return {color:p.color.toLowerCase(),alpha:p.alpha,start:p.start.slice(),edges:p.edges.map(([kind,...points])=>[kind,...points.map(n=>Math.max(0,Math.min(100,n)))])};
 });
 const {width,height}=crowdShapeBounds(paths);
 if(width<32||height<45)throw Error('Crowd silhouette is too small.');
 return paths;
}
const expressions=['smile','grin','neutral','closed','glasses'];
function validateCrowdFaces(v,n){
 if(!Array.isArray(v)||v.length!==n)throw Error('Crowd face anchors must match the silhouettes.');
 return v.map(m=>{
  if(m===null)return null;
  if(!Array.isArray(m)||m.length!==4)throw Error('Invalid Crowd face anchor.');
  const [x,y,spread,expression]=m;
  if(![x,y,spread].every(Number.isInteger)||spread<6||spread>17||x-spread<6||x+spread>94||y<12||y>59||!expressions.includes(expression))throw Error('Invalid Crowd face anchor.');
  return [x,y,spread,expression];
 });
}
export function validateCrowdRecipe(v){
 const hasBody=v&&Object.hasOwn(v,'body'),vector=v?.body==='vector',shapes=vector&&Object.hasOwn(v,'shapes'),faces=shapes&&Object.hasOwn(v,'faces'),lineup=faces&&Object.hasOwn(v,'lineup');
 if(!exact(v,vector?['palette','accent','looks','seed','body',shapes?'shapes':'shape',...(faces?['faces']:[]),...(lineup?['lineup']:[])]:hasBody?['palette','accent','looks','seed','body']:['palette','accent','looks','seed'])||(hasBody&&!BODY_KEYS.includes(v.body))||!Array.isArray(v.palette)||v.palette.length!==3||!v.palette.every(hex)||new Set(v.palette.map(c=>c.toLowerCase())).size<2||!hex(v.accent)||!Number.isInteger(v.seed)||v.seed<0||v.seed>65535||!Array.isArray(v.looks)||v.looks.length!==3)throw Error('Invalid Crowd recipe.');
 const looks=v.looks.map(look=>{
   if(!exact(look,['uniform','detail','head','prop'])||!uniform.includes(look.uniform)||!detail.includes(look.detail)||!head.includes(look.head)||!prop.includes(look.prop))throw Error('Invalid Crowd outfit.');
   return {uniform:look.uniform,detail:look.detail,head:look.head,prop:look.prop};
 });
 let art;
 if(shapes){
  if(!Array.isArray(v.shapes)||v.shapes.length<2||v.shapes.length>(lineup?9:4)||v.shapes.some(shape=>!Array.isArray(shape)||shape.length>8))throw Error(lineup?'Use two to nine distinct Crowd figures.':'Use two to four Crowd silhouettes.');
  const drawn=v.shapes.map(shape=>validateCrowdShape(shape,lineup));
  if(drawn.flat().reduce((sum,p)=>sum+p.edges.length,0)>(lineup?288:160))throw Error('Crowd silhouettes are too complex.');
  // Reject palette-only clones. Compare the structure of each shape without colors.
  const signatures=drawn.map(shape=>JSON.stringify(shape.map(({start,edges})=>JSON.stringify([start,edges])).sort()));
  if(new Set(signatures).size!==drawn.length)throw Error('Crowd silhouettes must have distinct outlines.');
  const faceAnchors=faces?validateCrowdFaces(v.faces,drawn.length):null;
  if(lineup){
   if(!Number.isInteger(v.lineup)||v.lineup<1||v.lineup>drawn.length||!faceAnchors.some(Boolean))throw Error('Invalid featured Crowd lineup.');
   for(const [i,face] of faceAnchors.entries())if(face){
    const {minX,maxX,minY,maxY}=crowdShapeBounds(drawn[i]);
    const [x,y,spread]=face;
    if(x-spread-5<minX||x+spread+5>maxX||y-5<minY||y+18>maxY)throw Error('Crowd face landmarks exceed the figure.');
   }
  }
  art={shapes:drawn,...(faces?{faces:faceAnchors}:{}),...(lineup?{lineup:v.lineup}:{})};
 }else if(vector)art={shape:validateCrowdShape(v.shape)};
 return {palette:v.palette.map(c=>c.toLowerCase()),accent:v.accent.toLowerCase(),looks,seed:v.seed,...(hasBody&&v.body!=='human'?{body:v.body}:{}),...art};
}
export const validateCrowdReply=(v,route,previous)=>{
 if(route?.body==='unsupported'||(exact(v,['unsupported'])&&v.unsupported==='body'))throw Error(UNSUPPORTED_CROWD_BODY);
 if(!exact(v,['crowd']))throw Error('Only a Crowd recipe may be edited.');
 const compactMix=route.mixed&&(exact(v.crowd,['shapes'])||route.mixedFaces&&exact(v.crowd,['shapes','faces'])||route.mixedLineup&&exact(v.crowd,['shapes','faces','lineup']));
 const next=validateCrowdRecipe(compactMix?{
  body:'vector',shapes:v.crowd.shapes,...(Object.hasOwn(v.crowd,'faces')?{faces:v.crowd.faces}:{}),...(Object.hasOwn(v.crowd,'lineup')?{lineup:v.crowd.lineup}:{}),palette:['#c47d4c','#5a8caa','#758a64'],accent:'#f9dc9a',seed:37,
  looks:Array.from({length:3},()=>({uniform:'jersey',detail:'plain',head:'hair',prop:'none'}))
 }:v.crowd);
 const trustedBody=route?.body??previous?.body??'human';
 if(next.body==='bikini-cast'||next.body&&next.body!==trustedBody)throw Error('Crowd body was not requested.');
 if(trustedBody==='vector'){
  if(route.body){
   if(route.mixed?!next.shapes:!next.shape)throw Error(route.mixed?'Missing distinct Crowd silhouettes.':'Missing Crowd silhouette.');
   if(next.lineup&&!route.mixedLineup)throw Error('A named Crowd lineup was not requested.');
   if(next.faces&&!route.mixedFaces)throw Error('Refresh the game to use Crowd face anchors.');
  }else{
   delete next.shape;delete next.shapes;delete next.faces;delete next.lineup;
   if(previous?.shapes){next.shapes=previous.shapes;if(previous.faces)next.faces=previous.faces;if(previous.lineup)next.lineup=previous.lineup;}
   else if(previous?.shape)next.shape=previous.shape;
  }
 }
 if(trustedBody!=='human')next.body=trustedBody;
 if(route?.mode!=='revise'||!previous||route.body)return next;
 const f=route.fields;
 // Accessory revisions cannot unexpectedly change the row's outfits or pose distribution.
 return {...(f.palette?next:previous),seed:previous.seed,looks:previous.looks.map((look,i)=>({
  uniform:f.uniform?next.looks[i].uniform:look.uniform,detail:f.uniform?next.looks[i].detail:look.detail,
  head:f.head?next.looks[i].head:look.head,prop:f.prop?next.looks[i].prop:look.prop
 }))};
};
export function crowdMessages(prompt,route,previous,embedded=false){
 if(route.mixedLineup)return [
  {role:'system',content:(embedded?'Add the "crowd" field below to the scene JSON. ':'Return JSON with a single "crowd" field. ')+
  'Crowd has exactly "shapes","faces","lineup". "shapes" is 2..9 DIFFERENT AND individually recognizable busts from the same requested setting. Draw the main requested people FIRST in request order; then related named supporting people from the same setting when known or requested. Use 7 to 9 for a full named cast if enough distinct same-theme people fit; fewer for genuinely small explicit casts. Do not repeat people, drop main subjects, add random unrelated people or add generic placeholder extras. "lineup" is the integer count of main requested people at the start; the host centers those people and supplies a uniform visible size and baseline. Each shape uses 3 to 6 filled paths, bold signatures and enough room for eyes and lips. "faces" is one value per shape: front-facing people use [x,eyeY,spread,expression], eyes sit at x minus/plus spread, expression is "smile","grin","neutral","closed", or "glasses". Game draws facial marks. Example [50,34,8,"grin"]. Use integer x and y, y 12..59, spread 6..17. Position marks under hair and inside painted face. For masks or figures seen from behind use null. At least one visible humanoid face is required for a lineup. Use a null only for a legitimate design reason. Each path exactly {"color":"#D28A48","alpha":100,"start":[20,92],"edges":[["L",20,50],["Q",50,10,80,50],["L",80,92]]}. Coordinates integers 0..100, six-digit hex, 2..12 edges per path, total at most 288; aim for under 25 edges per bust. Do not include text, links, HTML or SVG strings. For exclusively nonhumanoid subjects instead return 2..4 recognizable shapes with faces all null and omit lineup.'},
  {role:'user',content:JSON.stringify({request:prompt})}
 ];
 if(route.mixed&&route.mixedFaces)return [
  {role:'system',content:(embedded?'Add the "crowd" field described here to the scene JSON. ':'Return only JSON with a single "crowd" field. ')+
  'The "crowd" object contains exactly "shapes" and "faces". "shapes" has one array of paths per requested character, 2 to 4 characters in requested order. "faces" has one value per character: for every front-facing humanoid, set [x,y,spread,expression], where x and y mark the center between the two eyes (integer 6..94 and 12..59 respectively), spread is the distance from center to EACH eye (6..17); x minus spread must be at least 6 and x plus spread at most 94; expression is "smile","grin","neutral","closed", or "glasses". Example [50,34,8,"grin"]. The game draws eyes and mouth at these anchors. Place them inside painted skin, below the hair and above the chin. Use "closed" for closed-eye characters, never make a human face blank. For silhouettes explicitly facing away, animals, helmets, and nonhumanoids use null and paint any visible character-specific face details as color paths. Use 3 to 7 closed filled paths per subject with shape-defining hair/headgear, face shape and shoulders. Make faces broad and leave negative space for eyes, not stick figures. First two subjects go in the two center seats. A path looks exactly like {"color":"#D28A48","alpha":100,"start":[20,92],"edges":[["L",20,50],["Q",50,10,80,50],["L",80,92]]}. Only integer coordinates 0..100, 2 to 12 edges per path and six-digit hex colors. No SVG strings, text or extra keys.'},
  {role:'user',content:JSON.stringify({request:prompt})}
 ];
 if(route.mixed)return [
  {role:'system',content:(embedded?'Add the "crowd" field described here to the scene JSON. ':'Return only JSON with a single "crowd" field. ')+
  'The "crowd" object has exactly one key, "shapes". It is an array with one array of colored paths per subject, up to four subjects, in requested order. Each subject uses 3 to 6 closed filled paths. A path looks exactly like {"color":"#D28A48","alpha":100,"start":[20,92],"edges":[["L",20,50],["Q",50,10,80,50],["L",80,92]]}. Use integer coordinates 0 to 100, 2 to 12 edges per path, and actual six-digit hex colors. Every path needs a visible filled area. Every subject should span at least 40 units wide and 55 tall. Draw simple recognizable head-and-shoulder silhouettes with signature colors and distinct outlines. The first and second figures get the two center seats. Do not add text, outlines, other keys or SVG strings.'},
  {role:'user',content:JSON.stringify({request:prompt})}
 ];
 const instructions='Design the appearance of exactly one crowd row. Return JSON only: {"crowd":{"palette":["#RRGGBB","#RRGGBB","#RRGGBB"],"accent":"#RRGGBB","looks":[{"uniform":"jersey","detail":"plain","head":"hair","prop":"none"}],"seed":37}}. Exactly 3 outfit objects and 3 palette colors (at least 2 distinct). Seed integer 0 to 65535. Strict allowed words: uniform '+uniform.join(', ')+'; detail '+detail.join(', ')+'; head '+head.join(', ')+'; prop '+prop.join(', ')+'. Compose these details and original colors to make the requested theme clear across all three looks, with intentional differences. For cheerleaders emphasize cheer uniforms, headbands, chevrons/bands and pompom variations. For accessory-only requests retain existing outfits and colors except what the request explicitly changes; if no recipe exists, use jerseys as the starting look. The trusted host repeats no exact poses: it decides 16 slots, sizes, clipping, staggered pose, skin, outfit and prop placement. Use the body preset requested by the host. Seal and kangaroo presets create actual animal bodies; never turn an animal request into a human outfit. For hostBody vector with a new silhouette, add body:\"vector\" and shape using the exact format below. Otherwise do not output geometry, HTML, JS, descriptions, extra keys, effects, or changes to other objects.';
 const vector=route.body==='vector'?' Draw ONE recognizable shoulders-up subject centered in a 0..100 integer artboard: 2 to 12 layered closed filled paths, main silhouette visibly spanning the artboard. shape entries are {\"color\":\"kit\",\"alpha\":100,\"start\":[x,y],\"edges\":[[\"L\",x,y],[\"Q\",cx,cy,x,y],[\"C\",cx1,cy1,cx2,cy2,x,y]]}. All points and controls between 0 and 100; 2 to 16 edges each, max 100 total, alpha 55/75/100 only, color kit/accent or #RRGGBB. Make one dominant, connected silhouette in side or three-quarter view when that best reveals its iconic outline. Map the broad base near the bottom and recognizable top features separately before plotting paths: shoulders-up creatures have no visible legs; for a long-neck subject place the small head in the upper quarter, the broad shoulders in the bottom quarter, and connect them with a visibly long narrow neck through the middle half. For an object with signature spout, wings, stem or handle, show them in the outline, not as dots or a printed motif. Paint the main silhouette with color kit so all 16 subjects can vary; layer clear contrasting details on top. Include no fine strokes: use visibly thick closed shapes. Check the resulting silhouette at thumbnail scale. For a vector body all three outfit records are required but the renderer ignores them: set each to {"uniform":"jersey","detail":"plain","head":"hair","prop":"none"}. Put ears, horns, accessories and all other visual details only into the bounded shape paths. For a long-neck animal, make the small side-facing head extend sideways off the upper end of one continuous neck; give it a distinct muzzle and visible eye, and put any ears or short horns above the head, not near its shoulders.':' Omit shape and shapes; the host keeps any saved vector geometry unchanged.';
 return [{role:'system',content:instructions+vector},{role:'user',content:JSON.stringify({request:prompt,mode:route.mode,hostBody:route.body??previous?.body??'human',newSilhouette:route.body==='vector',...(route.mixed?{distinctSilhouettes:true}:{}),...(route.mode==='revise'?{editable:route.fields}:{}),...(route.mode==='revise'&&previous?{previous}:{})})}];
}
export function crowdPlan(recipe){
 const seats=[];
 if(recipe.shapes){
  const count=recipe.shapes.length,seed=recipe.seed%count;
  seats[7]=0;seats[8]=1;
  for(const [start,end,step] of [[6,-1,-1],[9,16,1]]){
   for(let i=start;i!==end;i+=step){
    const desired=(i+seed)%count;
    seats[i]=desired===seats[i-step]?(desired+1)%count:desired;
   }
  }
 }
 return Array.from({length:16},(_,i)=>{
  const j=(i*5+(recipe.seed%16))%16;
  const artIndex=seats[i];
  return {i,...(artIndex===undefined?{}:{artIndex}),look:recipe.looks[(i+recipe.seed)%3],pose:j%4,height:j%4+Math.floor(j/4),width:16+Math.floor(j/4)*1.2,kit:recipe.palette[(i+Math.floor(j/4))%3],variant:Math.floor(j/4)};
 });
}
