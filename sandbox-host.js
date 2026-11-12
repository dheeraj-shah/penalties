// Only this reviewed host script runs in the opaque iframe. Generated code runs
// in a separate thread, never in this document or the parent document.
'use strict';
let active=null;
const stop=()=>{if(active){clearTimeout(active.timer);active.worker.terminate();URL.revokeObjectURL(active.url);active=null;}};
addEventListener('message',e=>{
 if(e.source!==parent||!e.data||e.data.kind!=='render')return;
 const {id,input,state}=e.data;let code=e.data.code;
 if(typeof id!=='string'||typeof code!=='string'||code.length>10000)return;
 stop();
 code=code.trim().replace(/^```(?:javascript|js)?\s*\n?/, '').replace(/\n?```$/, '').trim().replace(/^export\s+default\s+/, '');
 if(/^(?:async\s+)?function\s*(?:[A-Za-z_$][\w$]*\s*)?\(/.test(code)||/^(?:async\s*)?\([^)]*\)\s*=>/.test(code))code='return await ('+code.replace(/;\s*$/,'')+')(ctx,state,input);';
 if(typeof OffscreenCanvas==='undefined'){parent.postMessage({kind:'result',id,error:'Your browser does not support isolated canvas rendering.'},'*');return;}
 // Host functions are captured before untrusted code starts. No credential or
 // prompt is sent here. Generated code has no DOM, storage identity or network.
 const prefix=`'use strict';\nconst send=postMessage.bind(self), stringify=JSON.stringify.bind(JSON), Canvas=OffscreenCanvas;\nfor(const key of ['Worker','SharedWorker','BroadcastChannel','importScripts'])Object.defineProperty(self,key,{value:undefined,writable:false,configurable:false});\nonmessage=async e=>{try{const {state,input}=e.data;const canvas=new Canvas(1000,610),ctx=canvas.getContext('2d');\nconst draw=async function(ctx,state,input){\n`;
 const suffix=`\n};\nconst result=await draw(ctx,state,input)||{};const text=stringify(result);if(text.length>4000)throw Error('State too large');if(canvas.width!==1000||canvas.height!==610)throw Error('Invalid canvas dimensions');const bitmap=canvas.transferToImageBitmap();send({bitmap,text},[bitmap]);}catch{send({error:'Generated code could not render safely.'});}};`;
 const url=URL.createObjectURL(new Blob([prefix,code,suffix],{type:'text/javascript'}));
 let worker;try{worker=new Worker(url);}catch{URL.revokeObjectURL(url);parent.postMessage({kind:'result',id,error:'Isolated code mode is unavailable in this browser.'},'*');return;}
 const finish=(data,transfer=[])=>{stop();parent.postMessage({kind:'result',id,...data},'*',transfer);};
 active={worker,url,timer:setTimeout(()=>finish({error:'Code exceeded its rendering time limit. Previous game kept.'}),500)};
 worker.onmessage=e=>{const d=e.data;if(d?.error)return finish({error:'Generated code could not render safely.'});if(!(d?.bitmap instanceof ImageBitmap)||d.bitmap.width!==1000||d.bitmap.height!==610||typeof d.text!=='string'||d.text.length>4000)return finish({error:'Invalid generated output.'});try{const value=JSON.parse(d.text);if(!value||typeof value!=='object'||Array.isArray(value))throw Error();finish({bitmap:d.bitmap,state:value},[d.bitmap]);}catch{finish({error:'Invalid generated state.'});}};
 worker.onerror=()=>finish({error:'Generated code had a syntax or runtime error.'});
 worker.postMessage({input,state});
});
parent.postMessage({kind:'sandbox-ready'},'*');
