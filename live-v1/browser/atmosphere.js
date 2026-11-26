import {CAMERA,ART_BOUNDS} from './camera.js';

const W=CAMERA.width;
const horizon=ART_BOUNDS.stands.y;
const seedRandom=seed=>()=>{
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed/4294967296;
};
function region(g,x,y,w,h,paint){
  g.save();
  try{g.beginPath();g.rect(x,y,w,h);g.clip();paint();}finally{g.restore();}
}
const line=(g,x,y,a,b,color,w=1)=>{
  g.beginPath();g.moveTo(x,y);g.lineTo(a,b);g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.stroke();
};
const oval=(g,x,y,rx,ry,color)=>{
  g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill();
};
const box=(g,x,y,w,h,color)=>{
  g.fillStyle=color;g.fillRect(x,y,w,h);
};
const shape=(g,points,color)=>{
  g.beginPath();for(const [i,[x,y]] of points.entries())i?g.lineTo(x,y):g.moveTo(x,y);
  g.closePath();g.fillStyle=color;g.fill();
};

const skies={
  'violet-night':['#152645','#475274','#897087','#c7d9e8'],
  'copper-dawn':['#34233e','#a64f58','#f5a775','#ffe0a1'],
  'polar-clear':['#194b80','#498fb9','#b5dbe4','#f2fbfb'],
  'storm-shelf':['#1d293a','#344759','#889695','#aabeb5'],
  'rose-nebula':['#211c44','#633b6c','#d78a9f','#f6bad3']
};

export function paintAtmosphereSky(g,recipe){
  if(!recipe)return;
  const [upper,mid,low,native]=skies[recipe.style],accent=recipe.accent??native;
  const rand=seedRandom(recipe.seed);
  region(g,0,0,W,horizon,()=>{
    const grad=g.createLinearGradient(0,0,0,horizon);
    grad.addColorStop(0,upper);grad.addColorStop(.64,mid);grad.addColorStop(1,low);
    box(g,0,0,W,horizon,grad);
    const x=655+rand()*185,y=recipe.style==='copper-dawn'?109:48;
    const halo=g.createRadialGradient(x,y,4,x,y,recipe.style==='rose-nebula'?129:82);
    halo.addColorStop(0,accent+'90');halo.addColorStop(1,accent+'00');
    box(g,x-130,0,260,horizon,halo);
    if(recipe.style!=='storm-shelf')oval(g,x,y,recipe.style==='rose-nebula'?30:15,recipe.style==='rose-nebula'?30:15,accent+'e8');
    if(recipe.style==='violet-night'||recipe.style==='rose-nebula'){
      for(let i=0;i<58;i++){
        const x=rand()*W,y=12+rand()*121;
        oval(g,x,y,.4+rand(),.55,accent+(i%8===0?'da':'65'));
      }
    }
    for(let i=0;i<12;i++){
      const x=rand()*W-65,y=48+rand()*120,span=40+rand()*170;
      const deep=recipe.style==='storm-shelf';
      shape(g,[[x,y],[x+span*.24,y-(deep?13:4)],[x+span*.68,y-(deep?9:4)],[x+span,y],[x+span*.43,y+(deep?12:3)]],deep?upper+'95':accent+'28');
    }
  });
}

const counts={aurora:3,rain:26,meteors:2,embers:17};
const weatherInk={aurora:'#68edb2',rain:'#a9def4',snow:'#edfafe',meteors:'#ffd3aa',embers:'#ffc086'};
export function paintAtmosphereWeather(g,recipe,seconds=0,reduced=false,snowHeight=CAMERA.height,snowOffset=0){
  if(!recipe)return;
  const rand=seedRandom(recipe.seed), density=recipe.density,style=recipe.style;
  const accent=recipe.accent??weatherInk[style],t=reduced?0:seconds%600;
  if(style==='snow'){
    const end=snowOffset?snowHeight:CAMERA.height;
    for(let i=0;i<56*density;i++){
      const speed=.45+rand()*.9,x0=rand()*W,y0=rand()*snowHeight;
      const y=(y0+t*29*speed)%snowHeight;
      if(y<snowOffset-3||y>end+3)continue;
      const x=(x0+W+Math.sin(t*.7+i)*12+t*speed*9)%W;
      oval(g,x,y-snowOffset,.7+speed*1.25,.7+speed*.93,accent+(i%4===0?'dd':'91'));
    }
    return;
  }
  const n=Math.min(78,counts[style]*density);
  region(g,0,8,W,174,()=>{
    if(style==='aurora'){
      for(let i=0;i<density+1;i++){
        const phase=t*.37+i*.86, y=29+i*21, wave=Math.sin(phase)*43;
        g.beginPath();g.moveTo(-30,y+24);
        g.bezierCurveTo(140,y-56+wave,310,y-57,500,y+25);
        g.bezierCurveTo(685,y+101,780,y-37+wave,1030,y-2);
        g.strokeStyle=accent+(i===1?'48':'30');g.lineWidth=11+i*5;g.stroke();
        g.strokeStyle=accent+'63';g.lineWidth=2;g.stroke();
      }
      return;
    }
    for(let i=0;i<n;i++){
      const speed=.45+rand()*.9,x0=rand()*W,y0=rand()*176;
      if(style==='meteors'){
        const phase=((i*.17+t*.24+speed)%1+1)%1;
        if(!reduced && phase>.38)continue;
        const x=((x0+W*2-phase*550)%W),y=18+(phase*110+y0*.18)%148;
        line(g,x+87,y-33,x,y,accent+'49',2.2);
        line(g,x+28,y-11,x,y,accent+'da',1.3);
        oval(g,x,y,2,1,accent);
        continue;
      }
      const fall=style==='rain'?165:-31;
      const x=(x0+W+Math.sin(t*.7+i)*12+Math.abs(t*speed*9))%W;
      const y=((y0+t*fall*speed)%174+174)%174+8;
      if(style==='rain')line(g,x,y,x-5*speed,y+10*speed,accent+(reduced?'40':'80'),.8);
      else oval(g,x,y,.5+speed*.75,.6+speed*.65,accent+(i%4===0?'ce':'7a'));
    }
  });
}

export function paintAtmosphereSkyline(g,recipe){
  if(!recipe)return;
  const rand=seedRandom(recipe.seed), style=recipe.style, accent=recipe.accent??'#8c9fb7';
  region(g,0,82,W,horizon-82,()=>{
    if(['alpine','canyon','cedar'].includes(style)){
      for(let layer=0;layer<3;layer++){
        const step=style==='cedar'?52:style==='alpine'?57:78;
        const points=[[0,horizon]];
        for(let x=-step;x<=W+step;x+=step){
          const height=(16+rand()*(style==='alpine'?79:54))*(1-layer*.20);
          const y=horizon-height-layer*2;
          if(style==='cedar')points.push([x,y+19],[x+step*.27,y],[x+step*.49,y+23]);
          else if(style==='canyon')points.push([x-8,y+20],[x,y],[x+step*.50,y],[x+step*.69,y+24]);
          else points.push([x,y],[x+step*.26,y+7],[x+step*.55,y+21]);
        }
        points.push([W,horizon]);
        shape(g,points,[accent+'62','#30425d','#252e46'][layer]);
      }
      return;
    }
    // Urban/harbor presets gain two separated silhouettes behind the foreground.
    for(let layer=0;layer<2;layer++){
      const unit=(style==='harbor'?77:43)+(layer===0?13:0);
      const ink=layer===0?accent+'56':'#3b5069';
      for(let x=-unit+layer*17;x<W;x+=unit){
        const h=22+rand()*72-(layer===0?0:11), w=unit*(.52+rand()*.27);
        box(g,x,horizon-h,w,h,ink);
        if(style==='spire-city'&&rand()>.42)shape(g,[[x,horizon-h],[x+w*.52,horizon-h-11],[x+w,horizon-h]],ink);
      }
    }
    box(g,0,177,W,13,'#26324b');
    for(let x=-8;x<W;x+=style==='harbor'?96:39){
      const h=19+rand()*74,y=horizon-h;
      if(style==='harbor'){
        box(g,x,y+35,67,h,accent+'78');
        line(g,x+8,horizon,x+8,y,'#2b394d',4);line(g,x+8,y,x+65,y+8,'#2b394d',4);
        line(g,x+61,y+8,x+61,y+23,accent,1);
        for(let i=0;i<3;i++)box(g,x+12+i*15,y+42,5,3,'#f9dca3a5');
      }else{
        const wide=25+rand()*9;
        box(g,x,y,wide,h,'#273650');
        shape(g,[[x,y],[x+wide*.5,y-18],[x+wide,y]],accent+'80');
        for(let j=0;j<6;j++)if(rand()>.27)box(g,x+6+(j%2)*10,y+10+Math.floor(j/2)*9,3,4,accent+'bb');
      }
    }
  });
}

export function paintAtmosphereScenery(g,recipe){
  if(!recipe)return;
  const pocket=recipe.side==='right'?824:24;
  const rand=seedRandom(recipe.seed), accent=recipe.accent??'#75c5be';
  region(g,pocket,106,152,83,()=>{
    g.translate(pocket+73,180);
    oval(g,5,4,55,4,'#1523349c');
    switch(recipe.style){
      case 'crash-pod':
        g.save();g.rotate(-.22);
        oval(g,0,-10,41,10,'#332b38');oval(g,0,-12,36,12,'#b48458');
        oval(g,-2,-22,18,9,'#57788b');line(g,-37,-10,34,-10,accent,3);
        g.restore();
        break;
      case 'lighthouse':
        shape(g,[[-12,0],[-7,-57],[8,-57],[14,0]],'#e0dacf');
        box(g,-9,-61,19,10,'#2a3241');box(g,-5,-59,11,5,accent);
        box(g,-10,-29,21,8,'#9d5558');shape(g,[[7,-57],[66,-69],[66,-46]],accent+'40');
        break;
      case 'kinetic-arch':
        g.beginPath();g.ellipse(0,-19,37,27,-.08,Math.PI,Math.PI*2);g.lineWidth=7;g.strokeStyle=accent;g.stroke();
        line(g,-37,-18,-37,0,'#d3ba91',5);line(g,37,-22,37,0,'#d3ba91',5);
        for(let i=0;i<5;i++)oval(g,-17+i*8,-23-i%2*3,2,2,'#e2bd80');
        break;
      case 'radio-dish':
        line(g,0,-24,-16,0,'#7a8fa4',5);line(g,0,-24,15,0,'#7a8fa4',5);
        g.save();g.rotate(-.28);g.beginPath();g.ellipse(3,-35,30,15,0,0,Math.PI);g.fillStyle=accent;g.fill();
        line(g,1,-34,10,-56,'#bcc8d2',2);oval(g,10,-55,3,3,'#ffba76');g.restore();
        break;
      case 'paper-lantern':
        line(g,-14,0,-14,-57,'#785450',4);line(g,-14,-57,20,-57,'#785450',4);
        line(g,16,-56,16,-44,'#b2a28a',1);
        oval(g,16,-34,13,13,accent);line(g,11,-47,11,-22,'#f3d8ad75',1);
        line(g,19,-47,19,-22,'#f3d8ad75',1);line(g,16,-22,16,-13,'#c58962',2);
        break;
    }
    for(let i=0;i<7;i++)oval(g,-52+rand()*104,1+rand()*5,2+rand()*5,1.5,'#69738793');
  });
}

const kits={
  scarves:['#6d5896','#aa87c6','#594b84','#a8648a'],
  raincoats:['#d1a54f','#a66b37','#668f87','#738699'],
  pilots:['#888c91','#5f667a','#abb8b6','#5b716d'],
  festival:['#ad577b','#c08357','#4a9591','#786ab3'],
  'away-end':['#ac6b3d','#d4a059','#853e4b','#e5c586']
};

export function paintAtmosphereCrowd(g,recipe){
  const b=ART_BOUNDS.crowd,style=recipe.style,palette=recipe.palette??kits[style],rand=seedRandom(recipe.seed);
  const accent=recipe.accent??'#ead9b6';
  const faces=['#e6bc9a','#9a654c','#b88761','#e2c0ab','#754e41'];
  region(g,b.x,b.y,b.width,b.height,()=>{
    for(let i=0;i<16;i++){
      const x=(i+.5)*62.5,y=208+Math.round(rand()*11),w=16+rand()*6;
      const skin=faces[Math.floor(rand()*faces.length)],kit=palette[Math.floor(rand()*palette.length)];
      const pose=Math.floor(rand()*4), variant=(i+pose)%4;
      const dark=variant===2?'#55394b':'#292735';
      oval(g,x,278,21,3,'#14172466');
      line(g,x-7,255,x-9,277,'#28293b',7);line(g,x+7,255,x+9,277,'#28293b',7);
      shape(g,[[x-7,y+9],[x-w,y+18],[x-w+3,259],[x+w-3,259],[x+w,y+18],[x+7,y+9]],kit);
      line(g,x-w+3,y+20,x-23,pose===0?y+3:y+38,kit,7);
      line(g,x+w-3,y+20,x+23,pose===1?y+4:y+38,kit,7);
      if(pose<2)line(g,x+(pose===0?-23:23),y+4,x+(pose===0?-24:24),y-5,skin,4);
      if(style==='raincoats' && variant!==1)oval(g,x,y-1,variant===0?13:11,13,kit);
      oval(g,x,y,8.4,10.3,skin);
      if(style==='pilots'){
        oval(g,x,y-5,11.2,variant===0?8:6,dark);
        if(variant%2===0)line(g,x-7,y,x+7,y,accent,3);
      }else if(style==='raincoats')line(g,x,y+12,x+1,256,accent+'80',1.5);
      else if(variant===0){
        box(g,x-9,y-11,17,6,dark);line(g,x-8,y-5,x+12,y-5,dark,3);
      }else{
        oval(g,x-1,y-6,8.5,5,dark);
        if(variant===2)line(g,x-7,y-4,x-9,y+4,dark,4);
      }
      if(style==='scarves'&&variant===1){
        line(g,x-w,y+21,x-22,y-5,kit,8);line(g,x+w,y+21,x+22,y-5,kit,8);
        line(g,x-23,y-5,x+23,y-5,accent,5);
        for(const dx of [-14,-4,6,16])line(g,x+dx,y-7,x+dx,y-3,kit,2);
      }else if(style==='scarves'||(style==='festival'&&variant%2===0)){
        line(g,x-7,y+13,x+7,y+13,accent,4);line(g,x+5,y+16,x+9,y+29,accent,5);
      }
      if(style==='away-end'||style==='festival'){
        for(const dx of [-6,1,8])line(g,x+dx,y+22,x+dx,253,accent+'80',2.5);
        if(pose===1){
          line(g,x+23,y+2,x+23,y-16,accent,1.1);
          shape(g,[[x+23,y-16],[x+43,y-13],[x+39,y-6],[x+23,y-8]],accent);
        }
      }
    }
  });
}


// Sky effects are clipped to the sky. Snow also paints the field and continuation.
export function createWeatherLayer(canvas,{document,query,requestFrame,cancelFrame,deckCanvas,sizeLayer}){
 const skyHeight=ART_BOUNDS.stands.y;
 let ctx,deckCtx,recipe,frame=0,lastPaint=-Infinity,deckHeight=0,paintHeight=0,paintDeckHeight=0;
 const clear=()=>ctx?.clearRect(0,0,CAMERA.width,paintHeight);
 const render=(now,reduced)=>{
  const fullHeight=CAMERA.height+(recipe.style==='snow'?deckHeight:0);
  clear();paintAtmosphereWeather(ctx,recipe,now/1000,reduced,fullHeight);
  if(deckCtx&&!deckCanvas.hidden){
   deckCtx.clearRect(0,0,CAMERA.width,paintDeckHeight);
   paintAtmosphereWeather(deckCtx,recipe,now/1000,reduced,fullHeight,CAMERA.height);
  }
 };
 const eligible=()=>recipe&&ctx&&!query.matches&&!document.hidden;
 function clock(now){
  frame=0;
  if(!eligible())return;
  if(now-lastPaint>=1000/30){render(now,false);lastPaint=now;}
  frame=requestFrame(clock);
 }
 function refresh(){
  if(frame)cancelFrame(frame);
  frame=0;
  const snow=recipe?.style==='snow',height=snow?CAMERA.height:skyHeight;
  if(!recipe){
   canvas.width=canvas.height=1;ctx=null;paintHeight=0;canvas.hidden=true;
  }else if(paintHeight!==height){
   ctx=sizeLayer(canvas,CAMERA.width,height);paintHeight=height;
  }
  canvas.style.height=(height/CAMERA.height*100)+'%';
  canvas.style.objectFit=snow?'fill':'';
  if(deckCanvas){
   const rows=snow&&ctx?deckHeight:0;
   if(paintDeckHeight!==rows){
    if(rows)deckCtx=sizeLayer(deckCanvas,CAMERA.width,rows);
    else{deckCanvas.width=deckCanvas.height=1;deckCtx=null;}
    paintDeckHeight=rows;
   }
   deckCanvas.hidden=!deckCtx;
  }
  canvas.hidden=!ctx;
  if(!ctx)return;
  if(document.hidden)return;
  render(0,true);lastPaint=-Infinity;
  if(eligible())frame=requestFrame(clock);
 }
 function set(next){
  if(next===recipe)return;
  recipe=next;refresh();
 }
 query.addEventListener('change',refresh);
 document.addEventListener('visibilitychange',refresh);
 function resizeDeck(rows){
  if(!deckCanvas||rows===deckHeight)return;
  deckHeight=rows;
  if(recipe?.style==='snow')refresh();
 }
 return {set,resizeDeck};
}
