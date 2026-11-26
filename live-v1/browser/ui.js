// Only values are generated: selectors and CSS declarations remain trusted application code.
const COLORS = {background:'--bg',panel:'--panel',text:'--text',muted:'--muted',accent:'--accent',border:'--line'};
const RANGES = {radius:[0,24],letterSpacing:[-1,3],borderWidth:[1,3],headingWeight:[400,800]};
const FONTS = {sans:'system-ui, sans-serif',serif:'Georgia, serif',mono:'ui-monospace, monospace'};
export function validateUI(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input)))throw Error('Invalid UI settings.');
 const result={};
 for(const key of Reflect.ownKeys(input)){
  if(typeof key!=='string')throw Error('Unknown UI setting.');
  const descriptor=Object.getOwnPropertyDescriptor(input,key);
  if(!Object.hasOwn(descriptor,'value'))throw Error('Invalid UI setting.');
  const value=descriptor.value;
  if(Object.hasOwn(COLORS,key)){
   if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw Error('Use a six-digit hex color.');
   result[key]=value.toLowerCase();
  }else if(Object.hasOwn(RANGES,key)){
   const [min,max]=RANGES[key];
   if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||(key==='headingWeight'&&!Number.isInteger(value)))throw Error('UI number outside allowed range.');
   result[key]=value;
  }else if(key==='font'){
   if(typeof value!=='string'||!Object.hasOwn(FONTS,value))throw Error('Unsupported font.');
   result[key]=value;
  }else if(key==='buttonStyle'){
   if(!['solid','outline'].includes(value))throw Error('Unsupported button style.');
   result[key]=value;
  }else throw Error('Unknown UI setting.');
 }
 return result;
}
export function uiProperties(input){
 const ui=validateUI(input),properties={};
 for(const [key,value] of Object.entries(ui)){
  if(Object.hasOwn(COLORS,key))properties[COLORS[key]]=value;
  else if(key==='radius')properties['--ui-radius']=`${value}px`;
  else if(key==='letterSpacing')properties['--ui-letter-spacing']=`${value}px`;
  else if(key==='borderWidth')properties['--ui-border-width']=`${value}px`;
  else if(key==='headingWeight')properties['--ui-heading-weight']=String(value);
  else if(key==='font')properties['--ui-font']=FONTS[value];
  else if(key==='buttonStyle'){
   properties['--ui-button-bg']=value==='outline'?'transparent':'var(--accent)';
   properties['--ui-button-text']=value==='outline'?'var(--accent)':'var(--bg)';
   properties['--ui-button-border']='var(--accent)';
  }
 }
 return properties;
}
