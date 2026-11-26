import {assertSkylineTransparency} from './skyline-alpha.js';
import {assertNoSkyCollision} from './sky-collision.js';
import {validatePitchTexture,drawPitchTexture} from './pitch-texture.js';
import {ART_BOUNDS,mergeArt} from './art-contract.js';
import {CAMERA} from './camera.js';
import {isolatedRender} from './sandbox-client.js';
function canvas(w=1000,h=610){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
export async function stageArt(prior,change,input,render=isolatedRender,previous={}){
 const registry=mergeArt(prior,change),surfaces={sky:canvas(),skyBackground:canvas(),scenery:canvas()},sprites={},cache={},repairs={...previous.repairs};
 // Render fresh disposable canvases per object. Generated state/outcomes are ignored.
 for(const layer of ['sky','skyline','stands','crowd','scenery','pitch','keeper','kicker','ball'])for(const obj of Object.values(registry).filter(o=>o.layer===layer).sort((a,b)=>{const bg=id=>['sky','sky-background','background','weather'].includes(id)?0:1;return layer==='sky'?bg(a.id)-bg(b.id):0;})){
  const isSkyBackground=layer==='sky'&&['sky','sky-background','background','weather'].includes(obj.id);const bounds=isSkyBackground?{x:0,y:0,width:1000,height:190}:ART_BOUNDS[layer];let probe=previous.cache?.[obj.id];if(!probe||prior[obj.id]?.code!==obj.code){const renderObject=layer==='pitch'?async()=>{const bitmap=canvas();drawPitchTexture(bitmap.getContext('2d'),bounds,validatePitchTexture(obj.code));bitmap.close=()=>{};return{bitmap};}:render;const result=await renderObject(obj.code,{...input,phase:'render',layer,bounds,anchor:CAMERA[layer]||{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height},canvas:{width:1000,height:610}},{});
  probe=canvas();const p=probe.getContext('2d',{willReadFrequently:true});p.drawImage(result.bitmap,0,0);result.bitmap.close();
  let pixels=p.getImageData(0,0,1000,610).data;
  if(layer==='skyline'){
   const {x,y,width:w,height:h}=bounds,margin=3;
   let touches=false;
   for(let yy=y;yy<y+margin&&!touches;yy++)for(let xx=x;xx<x+w;xx++)if(pixels[(yy*1000+xx)*4+3]>8){touches=true;break;}
   if(touches){
    // Fit only the in-bounds art, leaving any out-of-bounds pixels to the rejection below.
    const fitted=canvas(w,h-margin);
    const f=fitted.getContext('2d');f.imageSmoothingEnabled=true;f.drawImage(probe,x,y,w,h,0,0,w,h-margin);
    p.clearRect(x,y,w,h);p.drawImage(fitted,x,y+margin);
    pixels=p.getImageData(0,0,1000,610).data;
   }
  }
  if(['keeper','kicker','ball'].includes(layer)){
   let left=1000,top=610,right=-1,bottom=-1;
   for(let y=0;y<610;y++)for(let x=0;x<1000;x++)if(pixels[(y*1000+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right>=left&&(left<bounds.x||top<bounds.y||right>=bounds.x+bounds.width||bottom>=bounds.y+bounds.height)){
    const mx=Math.ceil(bounds.width*.1),my=Math.ceil(bounds.height*.1);
    if(left<bounds.x-mx||right>=bounds.x+bounds.width+mx||top<bounds.y-my||bottom>=bounds.y+bounds.height+my)throw Error('Artwork exceeded its '+layer+' bounds. Previous game kept.');
    const w=right-left+1,h=bottom-top+1,scale=Math.min(1,(bounds.width-8)/w,(bounds.height-8)/h);
    const fitted=canvas(),f=fitted.getContext('2d');const dx=bounds.x+(bounds.width-w*scale)/2,dy=layer==='ball'?bounds.y+(bounds.height-h*scale)/2:bounds.y+bounds.height-4-h*scale;
    f.drawImage(probe,left,top,w,h,dx,dy,w*scale,h*scale);p.clearRect(0,0,1000,610);p.drawImage(fitted,0,0);
    pixels=p.getImageData(0,0,1000,610).data;repairs[obj.id]={type:'bounded-fit',scale,source:{left,top,right,bottom}};
   }else delete repairs[obj.id];
  }
  let visible=0,inside=0;
  for(let y=0;y<610;y++)for(let x=0;x<1000;x++){const alpha=pixels[(y*1000+x)*4+3];const inBounds=x>=bounds.x&&x<bounds.x+bounds.width&&y>=bounds.y&&y<bounds.y+bounds.height;if(alpha>8&&!inBounds)throw Error('Artwork exceeded its '+layer+' bounds. Previous game kept.');if(inBounds){if(alpha>32)visible++;if(alpha>=250)inside++;}}
  if(layer==='skyline')assertSkylineTransparency(pixels,bounds);
  if(visible<20)throw Error('Empty '+layer+' artwork. Previous game kept.');
  if(layer==='pitch'&&inside!==bounds.width*bounds.height)throw Error('Pitch must cover its ground region.');
  if(layer==='keeper'||layer==='kicker'){let body=0;for(let y=bounds.y+Math.floor(bounds.height*.45);y<bounds.y+bounds.height;y++)for(let x=bounds.x;x<bounds.x+bounds.width;x++)if(pixels[(y*1000+x)*4+3]>32)body++;if(body<20)throw Error('Character body is missing.');}
  }cache[obj.id]=probe;
  if(layer==='sky'||layer==='scenery'){const c=surfaces[isSkyBackground?'skyBackground':layer].getContext('2d');c.save();c.beginPath();c.rect(bounds.x,bounds.y,bounds.width,bounds.height);c.clip();c.drawImage(probe,0,0);c.restore();}
  else if(['pitch','skyline','stands','crowd'].includes(layer))sprites[layer]=probe;
  else{const c=canvas(bounds.width,bounds.height);c.getContext('2d').drawImage(probe,bounds.x,bounds.y,bounds.width,bounds.height,0,0,bounds.width,bounds.height);sprites[layer]=c;}
 }
 assertNoSkyCollision(registry,cache,new Set(change.edits.map(e=>e.id)));
 return {registry,cache,repairs,sky:surfaces.sky,skyBackground:surfaces.skyBackground,scenery:surfaces.scenery,...sprites};
}
