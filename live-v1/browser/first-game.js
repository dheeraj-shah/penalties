// Stable across application releases; never clear this key on Restart/Revert.
export const FIRST_GAME_KEY='penalties:first-completed-game';
export function firstGameController(stores=[]){
 let completed=stores.some(s=>{try{return s?.getItem(FIRST_GAME_KEY)==='won';}catch{return false;}});
 const alreadyWon=()=>completed||stores.some(s=>{try{return s?.getItem(FIRST_GAME_KEY)==='won';}catch{return false;}});
 let assisted=!alreadyWon();
 return {
  get assisted(){return assisted;},
  beginRound(){assisted=!alreadyWon();return assisted;},
  outcome(normal){
   if(!assisted)return normal;
   // Keep target and shot type intact. Keeper visibly commits away from target.
   return {...normal,result:'goal',keeper:normal.aim==='left'?'right':normal.aim==='right'?'left':normal.keeper==='centre'?'left':normal.keeper};
  },
  completeRound(results,attempts){
   if(!assisted||results.length<attempts||!results.every(r=>r==='goal'))return false;
   completed=true;
   for(const store of stores){try{store?.setItem(FIRST_GAME_KEY,'won');}catch{}}
   return true;
  }
 };
}
