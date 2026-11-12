import {isolatedRender} from './sandbox-client.js';
const output=document.querySelector('#results');output.textContent='';let pass=0,fail=0;
const cases=[
 ['renders pixels',"ctx.fillStyle='#ff00aa';ctx.fillRect(10,10,50,50);return {ok:true};",x=>x.ok],
 ['no DOM or nested worker APIs',"return {safe:typeof window==='undefined'&&typeof document==='undefined'&&typeof Worker==='undefined'&&typeof SharedWorker==='undefined'&&typeof BroadcastChannel==='undefined'&&typeof importScripts==='undefined'}",x=>x.safe],
 ['network blocked',"try{await fetch('https://dheerajshah.com/penalties/network-probe');return {blocked:false}}catch{return {blocked:true}}",x=>x.blocked],
 ['imports blocked',"try{await import('https://dheerajshah.com/penalties/game.js');return {blocked:false}}catch{return {blocked:true}}",x=>x.blocked],
 ['dynamic eval blocked',"try{new Function('return 1')();return {blocked:false}}catch{return {blocked:true}}",x=>x.blocked],
 ['infinite loop terminated','while(true){}',x=>/time limit/.test(x.error||'')],
 ['renderer recovered','return {recovered:true}',x=>x.recovered],
 ['oversized state rejected',"return {tooBig:'x'.repeat(5000)}",x=>!!x.error],
 ['canvas resize rejected','ctx.canvas.width=999;',x=>!!x.error],
 ['worker parent unreachable',"return {safe:typeof parent==='undefined'&&typeof localStorage==='undefined'}",x=>x.safe]
];
for(const [name,code,check] of cases){let result;try{const r=await isolatedRender(code);r.bitmap.close();result=r.state;}catch(e){result={error:e.message};}const ok=check(result);if(ok)pass++;else fail++;output.textContent+=`${ok?'PASS':'FAIL'} ${name}${ok?'':' '+JSON.stringify(result)}\n`;}
output.textContent+=`\nTOTAL: ${pass} passed, ${fail} failed.`;
