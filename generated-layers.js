// Retain unrelated artwork in the host instead of trusting a model to repeat it.
const LAYERS=['scene','keeper','pitch','ball','rules'];
function body(code){let s=code.trim().replace(/^```(?:javascript|js)?\s*\n?/,'').replace(/\n?```$/,'').trim().replace(/^export\s+default\s+/,'');if(/^(?:async\s+)?function\s*(?:[A-Za-z_$][\w$]*\s*)?\(/.test(s)||/^(?:async\s*)?\([^)]*\)\s*=>/.test(s))return 'return await ('+s.replace(/;\s*$/,'')+')(ctx,state,input);';return s;}
export function mergeLayers(prior,code,targets){
 if(typeof code!=='string'||!Array.isArray(targets)||!targets.length||targets.some(t=>!LAYERS.includes(t)))throw Error('Invalid generated layers');
 const layers={...prior};for(const t of targets)layers[t]=code;
 const groups=new Map();for(const [layer,source]of Object.entries(layers)){if(!LAYERS.includes(layer)||typeof source!=='string')throw Error('Invalid retained layer');if(!groups.has(source))groups.set(source,[]);groups.get(source).push(layer);}
 const branches=[...groups].map(([source,ls])=>{const visible=ls.filter(t=>t!=='rules');if(ls.includes('rules')&&!layers.scene)visible.push('scene');return visible.length?'if('+JSON.stringify(visible)+'.includes(input.layer)){'+body(source)+'}':'';}).join('\n');
 const composed=branches+'\nreturn state;';if(composed.length>10000)throw Error('Your combined artwork is too large. Undo or reset before adding more. Previous game kept.');
 return {layers,code:composed,targets:Object.keys(layers)};
}
