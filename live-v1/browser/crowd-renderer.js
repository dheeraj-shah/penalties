import {ART_BOUNDS} from './camera.js';
import {crowdPlan,crowdShapeBounds} from './crowd-contract.js';

const faces=['#e7bd9a','#9a654c','#b88761','#e2c0ab','#754e41'];
const hair=['#292631','#513238','#292531','#302d35'];
function path(g,pts,color){g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);g.closePath();g.fillStyle=color;g.fill();}
function oval(g,x,y,rx,ry,color){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill();}
function stroke(g,pts,color,width){g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.stroke();}
function item(g,prop,x,y,kit,accent,side){
 if(prop==='pompom'){
  for(let j=0;j<11;j++){const a=j*Math.PI*2/11;stroke(g,[[x+Math.cos(a)*2,y+Math.sin(a)*2],[x+Math.cos(a)*7,y+Math.sin(a)*7]],j%3===0?kit:accent,2.6);}
  oval(g,x,y,2.4,2.4,accent);
 }else if(prop==='flag'){
  stroke(g,[[x,y+4],[x,y-15]],accent,1.4);path(g,[[x,y-15],[x+side*11,y-13],[x+side*8,y-8],[x,y-9]],kit);
 }else if(prop==='sign'){
  stroke(g,[[x,y+6],[x,y-8]],accent,1.4);path(g,[[x-6,y-15],[x+6,y-15],[x+6,y-7],[x-6,y-7]],kit);stroke(g,[[x-3,y-11],[x+3,y-11]],accent,1);
 }else if(prop==='glow')stroke(g,[[x,y+3],[x+side*3,y-10]],accent,3);
 else if(prop==='megaphone')path(g,[[x-2,y],[x+side*8,y-8],[x+side*10,y-1],[x,y+4]],accent);
 else if(prop==='flower'){
  stroke(g,[[x,y+2],[x,y-8]],kit,2);
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5;oval(g,x+Math.cos(a)*3,y-9+Math.sin(a)*3,2.2,2.2,accent);}
 }
}
// All positions are local to a single host-owned 62.5px slot; bounded dress-up never replaces these silhouettes.
function paintSeal(g,p,accent){
 const x=p.x,y=266-p.height/2,d=p.pose%2?-1:1,s=.87+p.variant*.043;
 const q=(a,b)=>[x+d*a*s,y+b*s];
 const e=(a,b,rx,ry,color)=>{const [cx,cy]=q(a,b);oval(g,cx,cy,rx*s,ry*s,color);};
 const pathAt=(points,color)=>path(g,points.map(([a,b])=>q(a,b)),color);
 const lineAt=(points,color,width)=>stroke(g,points.map(([a,b])=>q(a,b)),color,width*s);
 const base=p.kit, fringe='#283440', light=accent+'9c';
 oval(g,x,278,24,2.6,'#12172366');
 // No upright torso or legs: belly rests on the row, with paired tail flippers and a side flipper.
 pathAt([[-13,1],[-22,-7],[-30,-8],[-27,-3],[-22,1],[-31,3],[-26,7],[-16,5]],base);
 e(-1,-2,19,12,base);e(6,2,14,6,light);
 e(11,-10,11,13,base);
 const rise=[-24,-19,-22,-17][p.pose];e(15,rise,10.8,9.5,base);e(21,rise+4,5,4.5,accent+'67');
 const flipper=p.pose===1?-12:p.pose===2?-15:-2;
 pathAt([[1,-5],[1,2],[-9,flipper+8],[-15,flipper+3],[-6,-7]],base);
 lineAt([[1,-5],[-6,-7],[-14,flipper+4]],accent+'86',1.3);
 e(17,rise-2,1.6,1.8,fringe);e(25,rise+2,2.1,1.6,fringe);
 for(const off of [-2,1,3])lineAt([[23,rise+4],[30,rise+3+off]],fringe,.72);
 for(let i=0;i<3;i++)e(-8+i*4,-8+(i%2)*3,1.9,.9,light);
 if(p.look.prop==='scarf')lineAt([[7,-17],[16,-14],[18,-12],[13,-4]],accent,2.6);
 else if(p.look.prop!=='none'){const [a,b]=q(-14,flipper+4);item(g,p.look.prop,a,b,base,accent,-d);}
}
function paintKangaroo(g,p,accent){
 const x=p.x,y=276,d=p.pose%2===0?1:-1,s=.77+p.variant*.045;
 const q=(a,b)=>[x+d*a*s,y+b*s];
 const e=(a,b,rx,ry,color)=>{const [cx,cy]=q(a,b);oval(g,cx,cy,rx*s,ry*s,color);};
 const pathAt=(points,color)=>path(g,points.map(([a,b])=>q(a,b)),color);
 const lineAt=(points,color,width)=>stroke(g,points.map(([a,b])=>q(a,b)),color,width*s);
 const base=p.kit,dark='#513431',light=accent+'ac',lift=[0,3,-2,5][p.pose];
 oval(g,x,278,25,2.9,'#12172366');
 // Long ground tail, haunches, giant hocks, two erect ears and short forelimbs (not human proportions).
 pathAt([[-1,-16],[-12,-12],[-24,-7],[-34,-2],[-31,-1],[-19,-2],[-5,-5],[7,-10]],base);
 e(-2,-17,12,17,base);e(3,-31,8,17,base);e(4,-21,7,12,light);
 e(0,-13,9,10,base);lineAt([[2,-11],[-2,-2],[13,0]],base,7);e(12,-1,9.5,2.7,base);
 lineAt([[3,-34],[11,-26],[15,-29-lift]],base,3.8);
 e(14,-29-lift,2.5,2,dark);
 e(7,-47-lift,7.5,8,base);e(13,-44-lift,5.5,3.5,base);
 e(3,-59-lift,2.7,8.3,base);e(10,-59-lift,2.8,9.4,base);
 e(3,-59-lift,1,4.9,light);e(10,-59-lift,1,5.8,light);
 e(10,-48-lift,1.3,1.5,dark);e(18,-45-lift,1.5,1.6,dark);
 if(p.look.prop==='scarf')lineAt([[2,-41-lift],[11,-40-lift],[12,-30]],accent,3.2);
 else if(p.look.prop!=='none'){const [a,b]=q(17,-30-lift);item(g,p.look.prop,a,b,base,accent,d);}
}
const bodyPainters=Object.freeze({seal:paintSeal,kangaroo:paintKangaroo});
function paintHuman(g,p,x,y,w,dark,skin,accent){
 const {look,pose,kit,variant}=p;
  const skirt=look.uniform==='cheer'||look.uniform==='dress'||look.uniform==='robe';
  const vest=look.uniform==='vest'||look.uniform==='cheer';
  const headWidth=8+variant*.4;
  const bend=(variant-1.5)*.9;
  const feet=pose%2===0?[-9,9]:[-6,11];
  oval(g,x,278,22,3,'#14172466');
  stroke(g,[[x-6,251],[x+feet[0]-bend,269],[x+feet[0],276]],skirt?skin:dark,6.4);
  stroke(g,[[x+6,251],[x+feet[1]+bend,270],[x+feet[1],276]],skirt?skin:dark,6.4);
  for(const f of feet)stroke(g,[[x+f-2,277],[x+f+3,277]],skirt?accent:dark,3.4);
  const arms=p.arms||(pose===0?[-11,16]:pose===1?[13,-12]:pose===2?[-6,-10]:[19,14]);
  for(const [j,side] of [[0,-1],[1,1]]){
   const handX=x+side*(look.prop==='flag'||look.prop==='sign'?18:22),handY=y+arms[j]+13;
   const elbowX=x+side*(w+2),elbowY=y+Math.min(28,arms[j]+19);
   stroke(g,[[x+side*(w-4),y+15],[elbowX,elbowY],[handX,handY]],vest?skin:kit,vest?5.5:6.8);
   oval(g,handX,handY,2.7,2.7,skin);
   if(look.prop!=='scarf'&&(j===pose%2||(look.prop==='pompom'&&pose!==3)))item(g,look.prop,handX,handY-2,kit,accent,side);
  }
  stroke(g,[[x,y+5],[x,y+16]],skin,6);
  const waist=y+31;
  path(g,[[x-7,y+11],[x-w+(vest?4:0),y+16],[x-w+4,waist],[x+w-4,waist],[x+w-(vest?4:0),y+16],[x+7,y+11]],kit);
  if(skirt){
   const hem=look.uniform==='robe'?266:256-variant%2;
   path(g,[[x-9,waist-1],[x-w+2,hem-1],[x+w-2,hem-1],[x+9,waist-1]],kit);
   for(const s of [-1,1])stroke(g,[[x+6*s,waist+3],[x+8*s,hem-2]],accent+'a0',1.1);
   stroke(g,[[x-w+3,hem-1],[x+w-3,hem-1]],accent,1.8);
  }else path(g,[[x-w+4,waist-1],[x-w+3,258],[x+w-3,258],[x+w-4,waist-1]],kit);
  if(look.uniform==='armor')for(const s of [-1,1])oval(g,x+s*(w-3),y+15,5,3.7,accent);
  if(['jacket','workwear','robe'].includes(look.uniform))stroke(g,[[x,y+13],[x,y+32]],accent+'af',1.4);
  if(look.detail==='chevron')stroke(g,[[x-8,y+16],[x,y+23],[x+8,y+16]],accent,2.5);
  else if(look.detail==='band')stroke(g,[[x-9,y+21],[x+9,y+21]],accent,3.2);
  else if(look.detail==='stripes')for(const dx of [-6,0,6])stroke(g,[[x+dx,y+18],[x+dx,y+29]],accent+'aa',2);
  else if(look.detail==='checks'||look.detail==='spots')for(let j=0;j<6;j++)if(look.detail==='spots'||(j+Math.floor(j/3))%2===0)oval(g,x-6+(j%3)*6,y+19+Math.floor(j/3)*6,1.8,1.8,accent);
  else if(look.detail==='star'){const pts=Array.from({length:10},(_,j)=>[x+Math.sin(j*Math.PI/5)*(j%2?2:4),y+22-Math.cos(j*Math.PI/5)*(j%2?2:4)]);path(g,pts,accent);}
  if(look.head==='hood'||look.head==='helmet')oval(g,x,y-1,headWidth+3,12,kit);
  oval(g,x,y,headWidth,10.2,look.head==='ghost'?'#f0e7df':skin);
  if(look.head==='cap'){oval(g,x,y-6,headWidth+1,5,kit);stroke(g,[[x-8,y-3],[x+10,y-3]],accent,2.4);}
  else if(look.head==='crown')path(g,[[x-8,y-5],[x-8,y-14],[x-3,y-9],[x,y-15],[x+3,y-9],[x+8,y-14],[x+8,y-5]],accent);
  else if(look.head==='ears'){for(const s of [-1,1])oval(g,x+s*5,y-12,2.6,5.2,accent);}
  else if(look.head==='goggles'||look.head==='helmet')stroke(g,[[x-6,y-1],[x+6,y-1]],dark,3.2);
  else if(look.head!=='hood'&&look.head!=='ghost'){
   oval(g,x-1,y-6,headWidth,4.7+variant*.45,dark);
   if(variant%2===0)stroke(g,[[x-5,y-4],[x-8,y+4]],dark,3.5);
   if(variant===3)oval(g,x+8,y-7,3.2,4,dark);
   if(look.head==='headband')stroke(g,[[x-7,y-4],[x+7,y-4]],accent,2.1);
  }
  if(look.head==='ghost')for(const dx of [-3,3])oval(g,x+dx,y+1,1.2,1.7,dark);
  if(look.prop==='scarf'){stroke(g,[[x-8,y+11],[x+7,y+11],[x+9,y+23]],accent,3.5);stroke(g,[[x+9,y+21],[x+9,y+23]],kit,1.6);}
}
const svgImages=new WeakMap();
const scaleOf=(p,face)=>[((p.variant===1?-1:1)*(face?55+p.variant:50+p.variant*2))/100,(72+p.height*1.6)/100];
const pathFill=(p,color,accent)=>color==='kit'?p.kit:color==='accent'?accent:color;
const shapePath=({start,edges})=>'M '+start.join(' ')+' '+edges.map(cmd=>cmd.join(' ')).join(' ')+' Z';
// Compact landmark art belongs to the host, not to external SVG/XML.
const skinMark='#2d202c';
function faceMarks([x,y,d,emotion]){
 const closed=emotion==='closed',rings=emotion==='glasses';
 const eyes=[x-d,x+d].map(cx=>closed?{line:[[cx-3.8,y+1],[cx,y-1.5],[cx+3.8,y+1]]}:{ellipse:[cx,y,2.55,3.2]});
 if(rings)eyes.push({ring:[x-d,y,4.7,4.8]},{ring:[x+d,y,4.7,4.8]},{line:[[x-d+4.9,y],[x,y-.55],[x+d-4.9,y]]});
 const mouthY=y+10.5;
 const mouth=emotion==='grin'?{grin:[[x-5.1,mouthY],[x,mouthY+7.2],[x+5.1,mouthY]]}:{line:[[x-4.2,mouthY],[x,mouthY+(emotion==='neutral'?0:3.2)],[x+4.2,mouthY]]};
 return {eyes,mouth};
}
function svgFace(face){
 if(!face)return '';
 const {eyes,mouth}=faceMarks(face);
 const draw=o=>{
  if(o.ellipse||o.ring){
   const [cx,cy,rx,ry]=o.ellipse??o.ring;
   return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${o.ellipse?`fill="${skinMark}"`:`fill="none" stroke="${skinMark}" stroke-width="1.55"`}/>`;
  }
  const [a,b,c]=o.line??o.grin;
  return o.grin?`<path d="M ${a.join(' ')} Q ${b.join(' ')} ${c.join(' ')} Z" fill="${skinMark}"/>`:`<path d="M ${a.join(' ')} Q ${b.join(' ')} ${c.join(' ')}" fill="none" stroke="${skinMark}" stroke-width="2.3" stroke-linecap="round"/>`;
 };
 return [...eyes,mouth].map(draw).join('');
}
function canvasFace(g,face){
 if(!face)return;
 const {eyes,mouth}=faceMarks(face);
 g.globalAlpha=1;g.fillStyle=skinMark;g.strokeStyle=skinMark;g.lineCap='round';
 for(const o of [...eyes,mouth]){
  g.beginPath();
  if(o.ellipse||o.ring){
   g.ellipse(...(o.ellipse??o.ring),0,0,Math.PI*2);
   if(o.ring){g.lineWidth=1.55;g.stroke();}else g.fill();
   continue;
  }
  const [a,b,c]=o.line??o.grin;
  g.moveTo(...a);g.quadraticCurveTo(...b,...c);
  if(o.grin){g.closePath();g.fill();}else{g.lineWidth=2.3;g.stroke();}
 }
}
// Full named cast: each figure gets one seat, stable equal visible bounds, and a common bottom.
export function crowdLineupPlacements(recipe,b=ART_BOUNDS.crowd){
 const n=recipe.shapes.length,center=b.x+b.width/2,spacing=Math.min(104,(b.width-120)/n),wide=Math.min(72,spacing-14);
 const slots=Array.from({length:n},(_,i)=>({i,center:center+(i-(n-1)/2)*spacing}));
 const centerFirst=[...slots].sort((a,b)=>Math.abs(a.center-center)-Math.abs(b.center-center)||a.i-b.i);
 const figures=new Map();
 for(let i=0;i<recipe.lineup;i++)figures.set(centerFirst[i].i,i);
 let spare=recipe.lineup;
 for(const {i} of slots)if(!figures.has(i))figures.set(i,spare++);
 const base=b.y+b.height-5,high=77;
 return slots.map(slot=>{
  const index=figures.get(slot.i),bounds=crowdShapeBounds(recipe.shapes[index]);
  const sx=wide/bounds.width,sy=high/bounds.height;
  return {i:slot.i,index,center:slot.center,sx,sy,x:slot.center-(bounds.minX+bounds.maxX)*sx/2,y:base-bounds.maxY*sy,width:wide,height:high,base};
 });
}
// Only called with normalized recipe data, never model-provided XML, CSS, URLs or arbitrary attributes.
export function mixedCrowdSvg(recipe){
 const {x,y,width,height}=ART_BOUNDS.crowd;
 const groups=recipe.lineup?crowdLineupPlacements(recipe).map(p=>{
  const seat={kit:recipe.palette[p.index%3]},paths=recipe.shapes[p.index].map(part=>`<path fill="${pathFill(seat,part.color,recipe.accent)}" opacity="${part.alpha/100}" d="${shapePath(part)}"/>`).join('');
  return `<g transform="translate(${p.x} ${p.y}) scale(${p.sx} ${p.sy})">${paths}${svgFace(recipe.faces[p.index])}</g>`;
 }).join(''):crowdPlan(recipe).map(p=>{
  const face=recipe.faces?.[p.artIndex],cx=x+(p.i+.5)*width/16+(p.pose-1.5)*1.2,[sx,sy]=scaleOf(p,face);
  const paths=recipe.shapes[p.artIndex].map(part=>`<path fill="${pathFill(p,part.color,recipe.accent)}" opacity="${part.alpha/100}" d="${shapePath(part)}"/>`).join('');
  return `<g transform="translate(${cx} ${y+height-5}) scale(${sx} ${sy}) translate(-50 -100)">${paths}${svgFace(face)}</g>`;
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width*2}" height="${height*2}" viewBox="${x} ${y} ${width} ${height}">${groups}</svg>`;
}
function paintCrowdPaths(g,shape,kit,accent,face){
 for(const {color,alpha,start,edges} of shape){
  g.beginPath();g.moveTo(...start);
  for(const [type,...coords] of edges){
   if(type==='L')g.lineTo(...coords);
   else if(type==='Q')g.quadraticCurveTo(...coords);
   else g.bezierCurveTo(...coords);
  }
  g.closePath();g.fillStyle=color==='kit'?kit:color==='accent'?accent:color;
  g.globalAlpha=alpha/100;g.fill();
 }
 canvasFace(g,face);
}
function paintCrowdVector(g,p,x,b,shape,accent,face){
 const [sx,sy]=scaleOf(p,face);
 g.save();g.translate(x+(p.pose-1.5)*1.2,b.y+b.height-5);
 g.scale(sx,sy);g.translate(-50,-100);
 paintCrowdPaths(g,shape,p.kit,accent,face);
 g.restore();
}
// Match the owner-approved SVG. Crop only its existing coordinate band.
const bikiniSvg="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"2442\" height=\"210\" viewBox=\"56 298 1221 105\">\n<title>Bikini Bottom crowd, offline visual proof</title>\n<desc>Editable artwork for the 1222 x 105 audience band. No generated game state.</desc>\n<defs>\n<clipPath id=\"stand\"><path d=\"M56 298h1221v105H56z\"/></clipPath>\n<linearGradient id=\"seats\" x2=\"0\" y2=\"1\" gradientUnits=\"objectBoundingBox\"><stop stop-color=\"#1c2332\"/><stop offset=\"1\" stop-color=\"#192030\"/></linearGradient>\n<g id=\"eyes\">\n<ellipse cx=\"24\" cy=\"29\" rx=\"7\" ry=\"10\" fill=\"#fff6dc\"/><ellipse cx=\"39\" cy=\"29\" rx=\"7\" ry=\"10\" fill=\"#fff6dc\"/><circle cx=\"26\" cy=\"30\" r=\"3\" fill=\"#252738\"/><circle cx=\"38\" cy=\"30\" r=\"3\" fill=\"#252738\"/>\n</g>\n<g id=\"crabs\" stroke=\"#732d3e\" stroke-width=\"2\" stroke-linejoin=\"round\">\n<path d=\"M11 66q8-20 18-18h12q15 1 19 21l-7 21H15z\" fill=\"#77b1c9\"/><path d=\"M17 80h39l-4 10H16z\" fill=\"#46517e\"/>\n<path d=\"M7 54l12 2M56 58l10-9\" fill=\"none\" stroke=\"#d94847\" stroke-width=\"6\"/>\n<path d=\"M3 54c-7-5-5-14 0-18l5 8 4-10c10 2 8 15 3 20zM61 52c-5-8-3-15 2-20l6 9 5-9c9 7 4 20-5 21z\" fill=\"#e65752\"/>\n<path d=\"M27 27l-3-16q5-6 9 0l1 16m5 0l2-18q5-7 9 0l-4 19\" fill=\"#e65752\"/>\n<ellipse cx=\"35\" cy=\"42\" rx=\"20\" ry=\"16\" fill=\"#e65752\"/><path d=\"M26 44q8 8 17 0\" fill=\"none\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>\n<path d=\"M29 47l5 2 6-2\" fill=\"white\" stroke=\"none\"/>\n<ellipse cx=\"28\" cy=\"13\" rx=\"6\" ry=\"10\" fill=\"#fff6ce\"/><ellipse cx=\"45\" cy=\"12\" rx=\"6\" ry=\"10\" fill=\"#fff6ce\"/><path d=\"M30 11v4M45 10v4\" stroke=\"#232735\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n</g>\n<g id=\"squid\" stroke=\"#306764\" stroke-width=\"2\" stroke-linejoin=\"round\">\n<path d=\"M9 90q1-23 10-30l22-1q16 7 17 31z\" fill=\"#c59b68\"/><path d=\"M20 63l9 10 7-10\" fill=\"none\"/>\n<path d=\"M13 37c-5-9-2-21 5-26 8-6 19-6 27-1 9 6 11 16 6 28l-8 7-20 2z\" fill=\"#91d1b8\"/>\n<ellipse cx=\"26\" cy=\"36\" rx=\"7\" ry=\"13\" fill=\"#fcf1a5\"/><ellipse cx=\"39\" cy=\"36\" rx=\"7\" ry=\"13\" fill=\"#fcf1a5\"/>\n<path d=\"M27 35v5m12-6v5\" stroke=\"#7e3736\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n<path d=\"M39 40q17 8 12 19t-15 2q-6-5 0-20\" fill=\"#91d1b8\" stroke-linecap=\"round\"/>\n<path d=\"M20 56q5 2 10 0M18 48h9\" fill=\"none\" stroke-linecap=\"round\"/>\n</g>\n<g id=\"pearl\" stroke=\"#5b596e\" stroke-width=\"2\" stroke-linejoin=\"round\">\n<path d=\"M12 90q-2-23 13-30h20q15 7 16 30z\" fill=\"#ea82ac\"/><path d=\"M35 68l3 14h-7V68z\" fill=\"#9c4179\" stroke=\"none\"/>\n<path d=\"M14 58L10 25Q17 12 38 13L56 25v32Q43 68 22 62z\" fill=\"#a5acbb\"/><path d=\"M10 25q0-18 19-20 14 0 19 11-12-4-18 10z\" fill=\"#f1c868\"/>\n<path d=\"M38 13q-2-13 8-12 7 0 4 9l-5 7\" fill=\"#f1c868\"/>\n<ellipse cx=\"27\" cy=\"35\" rx=\"6\" ry=\"8\" fill=\"#fff8ec\"/><ellipse cx=\"44\" cy=\"35\" rx=\"6\" ry=\"8\" fill=\"#fff8ec\"/><path d=\"M29 35v3m16-3v3\" stroke=\"#252738\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n<path d=\"M26 50q9 7 19 0\" fill=\"none\" stroke=\"#914f79\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n</g>\n<g id=\"puff\" stroke=\"#765438\" stroke-width=\"2\" stroke-linejoin=\"round\">\n<path d=\"M13 84q-3-25 12-32l19-1q18 8 19 33l-13 6H23z\" fill=\"#638cb2\"/>\n<path d=\"M25 25l8-9 6 5 9-3 3 8 10 2-3 8 7 8-5 7 2 9-10 4-4 9-11-2-8 3-7-8-10-2 2-12-4-8 7-4-1-11z\" fill=\"#eabc77\"/>\n<ellipse cx=\"37\" cy=\"49\" rx=\"19\" ry=\"16\" fill=\"#fbe1a6\" stroke=\"none\"/>\n<ellipse cx=\"31\" cy=\"45\" rx=\"6\" ry=\"8\" fill=\"#fff7d7\"/><ellipse cx=\"45\" cy=\"45\" rx=\"6\" ry=\"8\" fill=\"#fff7d7\"/>\n<path d=\"M32 44v4m12-4v4m-9 10q5 3 9-1\" fill=\"none\" stroke=\"#5e4743\" stroke-linecap=\"round\"/>\n<path d=\"M28 23q2-14 11-13 7 0 10 13z\" fill=\"#5f87b2\" stroke=\"#3b5b78\"/><path d=\"M29 23h27\" stroke=\"#3b5b78\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n</g>\n<g id=\"gary\" stroke=\"#4b5876\" stroke-width=\"2\">\n<path d=\"M6 79q1-6 9-7h30q8-6 8-13v-8q0-7 7-7t7 11v24q0 11-12 11H13q-10 0-7-11z\" fill=\"#75c5bf\"/>\n<path d=\"M51 56l-2-18m14 16 4-19\" stroke=\"#75c5bf\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n<ellipse cx=\"47\" cy=\"32\" rx=\"7\" ry=\"11\" fill=\"#e7ec99\"/><ellipse cx=\"68\" cy=\"30\" rx=\"7\" ry=\"11\" fill=\"#e7ec99\"/>\n<path d=\"M49 31v4m19-6v4\" stroke=\"#dc6355\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n<path d=\"M10 73q-1-29 25-28 17 0 19 24-1 12-17 12H16z\" fill=\"#ee98b8\"/>\n<path d=\"M18 69q0-16 13-15t13 10q-1 8-9 7t-6-8\" fill=\"none\" stroke=\"#a84e88\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n</g>\n<g id=\"larry\" stroke=\"#7d3942\" stroke-width=\"2\" stroke-linejoin=\"round\">\n<path d=\"M16 89q-4-12 4-31l12-10h13l12 10q9 20 3 31z\" fill=\"#d7625b\"/><path d=\"M16 79h45l-1 11H17z\" fill=\"#81aac6\"/>\n<path d=\"M10 62q-13-9-8-21l6 7 5-12q9 6 9 13 0 8-6 14zm47 0q-4-11 1-18l4 5 3-12q12 7 10 16-2 9-12 12z\" fill=\"#e77568\"/>\n<path d=\"M8 63l11 6m43-5-5 5\" stroke=\"#d7625b\" stroke-width=\"7\"/>\n<path d=\"M22 29q4-13 14-13t16 13l-1 15q-5 11-15 12-9-1-14-12z\" fill=\"#e6766d\"/>\n<path d=\"M29 19q-2-9-7-12m23 11q1-8 7-12\" fill=\"none\"/>\n<ellipse cx=\"31\" cy=\"30\" rx=\"5\" ry=\"7\" fill=\"#fff0d5\"/><ellipse cx=\"43\" cy=\"30\" rx=\"5\" ry=\"7\" fill=\"#fff0d5\"/><path d=\"M32 29v4m11-4v4m-11 9q4 4 8 0\" stroke=\"#4a3b4a\" stroke-linecap=\"round\" fill=\"none\"/>\n</g>\n<g id=\"plankton\" stroke=\"#285954\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n<path d=\"M24 88q-16-1-13-15L18 48q5-13 17-11t14 18l1 23q1 10-9 12z\" fill=\"#78ba78\"/>\n<path d=\"M23 41l-7-21-9-10m29 30 8-22 9-11m-37 61L5 58m42 8 12-9\" stroke=\"#78ba78\" stroke-width=\"4\" fill=\"none\"/>\n<ellipse cx=\"31\" cy=\"60\" rx=\"11\" ry=\"12\" fill=\"#ffeb9d\"/><path d=\"M33 55v9\" stroke=\"#b65052\" stroke-width=\"4\"/><path d=\"M26 76q7 4 13-2\" fill=\"none\"/>\n</g>\n<g id=\"fishTall\" stroke=\"#4c547a\" stroke-width=\"2\" stroke-linejoin=\"round\">\n<path d=\"M10 89q0-19 14-29h21q14 11 15 29z\" fill=\"#78969d\"/>\n<path d=\"M15 42Q9 19 28 14l-2-8 11 6 8-6 2 11q14 8 14 24-1 20-24 26-19-2-22-25\" fill=\"#9ab8df\"/>\n<ellipse cx=\"27\" cy=\"36\" rx=\"6\" ry=\"8\" fill=\"#fff4d8\"/><ellipse cx=\"44\" cy=\"36\" rx=\"6\" ry=\"8\" fill=\"#fff4d8\"/><path d=\"M28 35v4m15-4v4m-13 12q5 4 13 0\" fill=\"none\" stroke-linecap=\"round\"/>\n</g>\n<g id=\"fishRound\" stroke=\"#70526d\" stroke-width=\"2\" stroke-linejoin=\"round\">\n<path d=\"M11 89q-2-21 13-26h22q18 10 13 26z\" fill=\"#b293c6\"/>\n<path d=\"M17 33Q20 18 39 20q19 2 23 20-1 23-28 27Q14 60 17 45L6 49l3-21 10 7z\" fill=\"#e697a6\"/>\n<ellipse cx=\"30\" cy=\"37\" rx=\"6\" ry=\"8\" fill=\"#fff5dc\"/><ellipse cx=\"46\" cy=\"37\" rx=\"6\" ry=\"8\" fill=\"#fff5dc\"/><path d=\"M31 37v3m15-3v3m-15 11q7 5 13-1\" fill=\"none\" stroke-linecap=\"round\"/>\n</g>\n</defs>\n<g clip-path=\"url(#stand)\">\n<path d=\"M56 298h1221v105H56z\" fill=\"url(#seats)\"/><path d=\"M56 351h1221m-1221 38h1221\" stroke=\"#8c91aa\" stroke-opacity=\".045\"/><path d=\"M58 401h1217\" stroke=\"#101624\" stroke-opacity=\".36\"/>\n\n<use href=\"#gary\" transform=\"translate(119 324) scale(.82)\"/>\n<use href=\"#puff\" transform=\"translate(264 322) scale(.84)\"/>\n<use href=\"#squid\" transform=\"translate(412 324) scale(.82)\"/>\n<use href=\"#crabs\" transform=\"translate(550 320) scale(.90)\"/>\n<use href=\"#pearl\" transform=\"translate(706 323) scale(.84)\"/>\n<use href=\"#plankton\" transform=\"translate(854 323) scale(.84)\"/>\n<use href=\"#larry\" transform=\"translate(1005 325) scale(.82)\"/>\n<use href=\"#fishRound\" transform=\"translate(1147 323) scale(.84)\"/>\n</g>\n</svg>\n";
let bikiniImage,bikiniPending;
export async function prepareCrowdSvg(recipe){
 if(recipe?.shapes){
 if(svgImages.has(recipe)||typeof Image!=='function')return;
 try{
  const img=new Image();
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(mixedCrowdSvg(recipe));
  await img.decode();svgImages.set(recipe,img);
 }catch{/* Draw the same validated geometry with the existing Canvas fallback. */}
 return;
}
if(recipe?.body!=='bikini-cast'||bikiniImage)return;
 if(!bikiniPending){
  bikiniPending=(async()=>{
   const image=new Image();
   image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(bikiniSvg);
   await image.decode();
   bikiniImage=image;
  })().finally(()=>{bikiniPending=undefined;});
 }
 await bikiniPending;
}
export function paintCrowdRecipe(g,recipe){
 if(recipe.body==='bikini-cast'){
  const b=ART_BOUNDS.crowd;
  if(!bikiniImage)throw Error('The Bikini Bottom crowd artwork could not load.');
  // The approved photo crop ends just above the stand baseline.
  g.drawImage(bikiniImage,b.x+1,b.y+.5,b.width-2,86);
  return;
 }
 const b=ART_BOUNDS.crowd,accent=recipe.accent;
 const img=svgImages.get(recipe);
 if(img){g.drawImage(img,b.x,b.y,b.width,b.height);return;}
 g.save();g.beginPath();g.rect(b.x,b.y,b.width,b.height);g.clip();
 if(recipe.lineup){
  for(const p of crowdLineupPlacements(recipe,b)){
   g.save();g.translate(p.x,p.y);g.scale(p.sx,p.sy);
   paintCrowdPaths(g,recipe.shapes[p.index],recipe.palette[p.index%3],accent,recipe.faces[p.index]);
   g.restore();
  }
  g.restore();return;
 }
 for(const p of crowdPlan(recipe)){
  const {look,pose,kit,variant}=p,x=b.x+(p.i+.5)*b.width/16,y=211+p.height,w=p.width,dark=hair[variant],skin=faces[(p.i+recipe.seed)%faces.length];
  if(recipe.body==='vector'){paintCrowdVector(g,p,x,b,recipe.shapes?.[p.artIndex]??recipe.shape,accent,recipe.faces?.[p.artIndex]);continue;}
  const body=Object.hasOwn(bodyPainters,recipe.body)?bodyPainters[recipe.body]:null;
  if(body){body(g,{...p,x},accent);continue;}
  paintHuman(g,p,x,y,w,dark,skin,accent);
 }
 g.restore();
}

// Fixed to the starting kits; an isolated player-kit edit must not recolor the fans.
const matchColors=[['#aa93cd','#8d77ae','#716586','#bfaed7','#e6dcf7','#493969'],['#f6ce57','#d1a84e','#ba9144','#f0db94','#fff0a4','#7c5a22']];
const matchHeads=['cap','hair','hood','hair','headband','cap','hair','hood','hair','cap','hood','hair','cap','hair','headband','hood'];
const matchHeights=[4,1,5,1,5,3,0,5,3,4,6,4,2,1,5,2];
const matchday=(()=>{
 const people=matchHeads.map((head,i)=>{
  const t=i<8?0:1,k=i%4,palette=matchColors[t],variant=(i*5+2)%4;
  return {x:31+(i%8)*61+t*511,y:211+matchHeights[i],kit:palette[(i+Math.floor(i/4))%4],cloth:palette[0],trim:palette[4],shade:palette[5],skin:faces[(i+(t?10:7))%faces.length],dark:hair[variant],variant,pose:(i*3+1)%4,w:16+k*1.25,look:{prop:'none',head,uniform:k===2?'jacket':'shirt',detail:['band','chevron','stripes','none'][k]},arms:[[14,-6],[-15,17],[16,12],[-3,-14]][k]};
 });
 const grip=(i,side,y)=>{
  const p=people[i];p.arms[side<0?0:1]=y-p.y-13;return {x:p.x+side*22,y,p};
 };
 const scarves=[0,2,5,7,8,10,13,15].map(i=>{const y=188+i%3*4;return [grip(i,-1,y),grip(i,1,y+1)];});
 const banners=[[1,3],[12,14]].map(([l,r])=>[grip(l,1,235),grip(r,-1,236)]);
 const flags=[{hand:grip(4,1,209),side:1},{hand:grip(11,-1,213),side:-1}];
 return {people,scarves,banners,flags,cheer:[...scarves.map(([l])=>l.p),...flags.map(({hand})=>hand.p)]};
})();
function clothBetween(g,l,r,banner){
 const {x:a,y}=l,{x:b}=r,{cloth,shade,trim}=l.p,m=(a+b)/2;
 const top=banner?0:-3,bottom=banner?15:5,bow=banner?6:4,thread=banner?9:1;
 g.beginPath();g.moveTo(a-1,y+top);g.quadraticCurveTo(m,y+top+bow,b+1,y+top+1);
 g.lineTo(b-1,y+bottom+1);g.quadraticCurveTo(m,y+bottom+bow,a+1,y+bottom);g.closePath();
 g.fillStyle=banner?shade:cloth;g.fill();g.strokeStyle=banner?cloth:shade;g.lineWidth=banner?1.9:1;g.stroke();
 g.beginPath();g.moveTo(a+6,y+thread);g.quadraticCurveTo(m,y+thread+bow,b-6,y+thread+1);
 g.strokeStyle=trim;g.lineWidth=banner?2:1.4;g.stroke();
 if(!banner)for(const x of [a-1,a+2,b-2,b+1])stroke(g,[[x,y+4],[x,y+9]],trim,1.1);
}
export function paintStandAisle(g,finish){
 const b=ART_BOUNDS.crowd;g.save();
 g.fillStyle=finish?finish.trim+'62':'#1b2230';g.fillRect(483,b.y+1,34,b.height-5);
 for(const x of [489,511])stroke(g,[[x,b.y+2],[x,b.y+b.height-6]],finish?finish.trim+'ab':'#313c4e',1);
 for(const y of [241,257,272])stroke(g,[[490,y],[511,y]],finish?finish.trim:'#374458',1);
 g.restore();
}
export function paintDefaultCrowd(g, reaction){
 const jump=p=>{
  if(!reaction||!matchday.cheer.includes(p)||(p.x<500)!==reaction.home)return 0;
  const t=reaction.phase, sway=Math.sin(t*Math.PI);
  return -sway*(3+Math.sin(4*t*Math.PI+p.x*.035)*3);
 };
 const shift=hand=>({...hand,y:hand.y+jump(hand.p)});
 const b=ART_BOUNDS.crowd;
 g.save();g.beginPath();g.rect(b.x,b.y-32,b.width,b.height+32);g.clip();

 const {people,scarves,banners,flags}=matchday;
 for(const p of people)paintHuman(g,p,p.x,p.y+jump(p),p.w,p.dark,p.skin,p.trim);
 for(const [pairs,banner] of [[scarves,false],[banners,true]])for(const pair of pairs){
  const [l,r]=reaction&&!banner?pair.map(shift):pair;
  clothBetween(g,l,r,banner);
  for(const h of [l,r])oval(g,h.x,h.y,2.65,2.65,h.p.skin);
 }
 for(const {hand,side:d} of flags){
  const {x,y,p}=reaction?shift(hand):hand;
  stroke(g,[[x,y+7],[x,y-40]],'#ddd5d6',1.8);
  g.beginPath();g.moveTo(x,y-39);g.quadraticCurveTo(x+d*15,y-46,x+d*34,y-39);g.lineTo(x+d*29,y-31);g.lineTo(x+d*34,y-23);g.quadraticCurveTo(x+d*16,y-30,x,y-23);g.closePath();
  g.fillStyle=p.cloth;g.fill();g.strokeStyle=p.shade;g.lineWidth=1;g.stroke();
  g.beginPath();g.moveTo(x+d*3,y-33);g.quadraticCurveTo(x+d*16,y-38,x+d*28,y-33);g.strokeStyle=p.trim;g.lineWidth=2;g.stroke();
  oval(g,x,y,2.65,2.65,p.skin);
 }
 g.restore();
}
