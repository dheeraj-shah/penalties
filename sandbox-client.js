let frame,ready,pending=null,lastBitmap=null;
export function isolatedRender(code,input={},state={}){
 if(!frame){frame=document.createElement('iframe');frame.sandbox='allow-scripts';frame.hidden=true;frame.src='/penalties/sandbox-host.html';frame.setAttribute('aria-hidden','true');ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Isolated renderer unavailable.')),5000);frame._ready=()=>{clearTimeout(timer);resolve();};});document.body.append(frame);}
 return ready.then(()=>new Promise((resolve,reject)=>{if(pending)return reject(Error('A render is already running.'));const id=crypto.randomUUID();const timer=setTimeout(()=>{pending=null;reject(Error('Isolated renderer timed out.'));},1500);pending={id,resolve,reject,timer};frame.contentWindow.postMessage({kind:'render',id,code,input,state},'*');}));
}
addEventListener('message',e=>{if(!frame||e.source!==frame.contentWindow||e.origin!=='null')return;const d=e.data;if(d?.kind==='sandbox-ready')return frame._ready?.();if(d?.kind!=='result'||!pending||d.id!==pending.id)return;const p=pending;pending=null;clearTimeout(p.timer);if(d.error)p.reject(Error(String(d.error).slice(0,140)));else if(d.bitmap instanceof ImageBitmap&&d.bitmap.width===1000&&d.bitmap.height===610)p.resolve(d);else p.reject(Error('Invalid isolated output.'));});
// Generated artwork is composited inside the trusted game renderer BEFORE goals,
// players and ball, never as a DOM overlay that conceals them.
export function showGenerated(bitmap,hasKeeper=false){
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=610;
 const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);if(hasKeeper)ctx.clearRect(400,150,200,170);bitmap.close();return canvas;
}
export function clearGenerated(){document.querySelector('#generated-layer')?.remove();}
export async function prepareGenerated(code,input,state,render=isolatedRender,targets=[]){
 const scene=await render(code,{...input,layer:'scene'},state);let keeper=null,pitch=null;
 try{
  if(targets.includes('keeper')||scene.state.replaceKeeper===true){
   const sprite=await render(code,{...input,phase:'render',layer:'keeper'},scene.state);
   keeper=document.createElement('canvas');keeper.width=200;keeper.height=170;
   const c=keeper.getContext('2d');c.drawImage(sprite.bitmap,400,150,200,170,0,0,200,170);sprite.bitmap.close();
   const p=c.getImageData(0,0,200,170).data;let visible=0;for(let i=3;i<p.length;i+=4)if(p[i]>32)visible++;
   if(visible<20)throw Error('Replacement keeper was empty. Previous game kept.');
  }
  if(targets.includes('pitch')||scene.state.replacePitch===true){
   const surface=await render(code,{...input,phase:'render',layer:'pitch'},scene.state);
   pitch=document.createElement('canvas');pitch.width=1000;pitch.height=610;
   const c=pitch.getContext('2d');c.drawImage(surface.bitmap,0,0);surface.bitmap.close();
   const p=c.getImageData(0,160,1000,450).data;for(let i=3;i<p.length;i+=4)if(p[i]<250)throw Error('Replacement pitch must cover the ground. Previous game kept.');
  }
  if(!keeper&&!pitch&&!targets.includes('rules')){const probe=document.createElement('canvas');probe.width=1000;probe.height=610;const c=probe.getContext('2d');c.drawImage(scene.bitmap,0,0);const pixels=c.getImageData(0,0,1000,610).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>32)visible++;if(visible<20)throw Error('Generated change had no visible effect. Previous game kept.');}
  return {...scene,keeper,pitch};
 }catch(error){scene.bitmap.close();throw error;}
}
