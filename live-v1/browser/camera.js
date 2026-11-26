// Trusted display geometry. Physics stays in game.js; only display coordinates change.
export const CAMERA=Object.freeze({width:1000,height:610,goal:{left:280,right:720,top:260,bottom:422},keeper:{x:500,y:422},ball:{x:500,y:500},kicker:{x:330,y:575}});
export const ART_BOUNDS=Object.freeze({sky:{x:24,y:20,width:952,height:110},skyline:{x:0,y:130,width:1000,height:60},scenery:{x:0,y:190,width:1000,height:110},stands:{x:0,y:190,width:1000,height:110},crowd:{x:0,y:190,width:1000,height:93},pitch:{x:0,y:300,width:1000,height:310},keeper:{x:420,y:300,width:160,height:122},ball:{x:450,y:450,width:100,height:100},kicker:{x:250,y:385,width:160,height:200}});
export function projectPoint({x,y}){return {x,y:y<=301?260+(y-175)*162/126:422+(y-301)*78/167};}
