export const PITCH_PATTERNS=['solid','stripes','checker','speckle','grass','snow','ice','lunar'];
export function validatePitchTexture(code){let t;try{t=JSON.parse(code);}catch{throw Error('Pitch uses a texture recipe, not drawing code.');}if(!t||Object.keys(t).some(k=>!['pattern','base','accent','scale'].includes(k))||!PITCH_PATTERNS.includes(t.pattern)||!/^#[0-9a-f]{6}$/i.test(t.base)||!/^#[0-9a-f]{6}$/i.test(t.accent)||!Number.isFinite(t.scale)||t.scale<8||t.scale>80)throw Error('Invalid pitch texture recipe');return t;}
export function drawPitchTexture(ctx,b,t){ctx.save();ctx.beginPath();ctx.rect(b.x,b.y,b.width,b.height);ctx.clip();ctx.fillStyle=t.base;ctx.fillRect(b.x,b.y,b.width,b.height);ctx.fillStyle=t.accent;const s=t.scale;if(t.pattern==='lunar'){drawLunarCraters(ctx,b,t);}else if(t.pattern==='stripes'||t.pattern==='checker'){for(let y=0;y<b.height;y+=s)for(let x=0;x<b.width;x+=s)if(t.pattern==='stripes'?Math.floor(y/s)%2===0:(Math.floor(y/s)+Math.floor(x/s))%2===0)ctx.fillRect(b.x+x,b.y+y,s,s);}else if(t.pattern!=='solid'){for(let i=0;i<900;i++){const x=b.x+(i*137.31)%b.width,y=b.y+(i*79.77)%b.height,r=t.pattern==='snow'?1.5:t.pattern==='ice'?s*.07:1;ctx.globalAlpha=t.pattern==='grass'?.32:.5;ctx.beginPath();ctx.ellipse(x,y,r,t.pattern==='grass'?4:r*.55,0,0,Math.PI*2);ctx.fill();}}ctx.restore();}

function drawLunarCraters(ctx,b,{accent,scale}){
 const tau=2*Math.PI,fract=x=>x-Math.floor(x);
 function ellipse(x,y,rx,ry,paint){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,tau);ctx.fillStyle=paint;ctx.fill();
 }
 for(let i=0;i<92;i++){
  const x=b.x+b.width*fract(.219+i*.618033989),depth=fract(.18+i*.481211825);
  const y=b.y+b.height*depth,variation=fract((i+1)*.754877666);
  const r=Math.max(2.5,scale*(.13+.36*variation*variation)*(.62+.68*depth));
  const rim=ctx.createLinearGradient(x,y-r*.55,x,y+r*.55);
  rim.addColorStop(0,'#f5f5ff7a');rim.addColorStop(.38,'#f5f5ff16');rim.addColorStop(1,'#0c0a1a62');
  ellipse(x,y,r,r*.51,rim);
  const floor=ctx.createLinearGradient(x,y-r*.32,x,y+r*.37);
  floor.addColorStop(0,'#0c0a1a80');floor.addColorStop(.60,accent+'85');floor.addColorStop(1,accent+'36');
  ellipse(x+r*.06,y-r*.03,r*.78,r*.36,floor);
 }
}
