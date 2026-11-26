import {pipeline, env} from './voice-assets/transformers.min.js';
env.allowRemoteModels=false;
env.allowLocalModels=true;
env.localModelPath='/penalties/voice-assets/models/';
env.useBrowserCache=true;
env.backends.onnx.wasm.wasmPaths='/penalties/voice-assets/';
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.proxy=false;
let model,loading;
function load(){return loading ||= pipeline('automatic-speech-recognition','whisper-tiny.en',{device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress')postMessage({type:'progress',file:p.file,progress:p.progress});}}).then(m=>{model=m;postMessage({type:'ready'});return m}).catch(e=>{loading=null;postMessage({type:'load-error',error:e.message});throw e;});}
self.onmessage=async({data})=>{try{if(data.type==='load'){await load();return;}if(data.type==='transcribe'){const m=await load();const result=await m(data.audio,{return_timestamps:false,max_new_tokens:128});postMessage({type:'result',id:data.id,text:result.text});}}catch(e){if(data.id)postMessage({type:'error',id:data.id,error:e.message});}};
