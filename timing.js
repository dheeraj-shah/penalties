export function timingText(phase,elapsedMs,responseMs){
 const seconds=ms=>(Math.max(0,Number.isFinite(ms)?ms:0)/1000).toFixed(1)+'s';
 return {headline:phase==='ready'?'Ready in '+seconds(elapsedMs)+' ⚡':phase==='failed'?'Not applied · '+seconds(elapsedMs):'Generating… '+seconds(elapsedMs),detail:phase==='ready'?'AI response: '+seconds(responseMs)+' · Applied: '+seconds(elapsedMs):phase==='failed'?'Previous game kept.':responseMs===undefined?'': 'AI response: '+seconds(responseMs)+' · Applying…'};
}
