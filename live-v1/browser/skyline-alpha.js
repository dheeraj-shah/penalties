// Skyline must be a transparent silhouette, not an opaque backdrop.
export function assertSkylineTransparency(pixels,bounds,width=1000){
 const {x,y,width:w,height:h}=bounds;let transparent=0;const roofs=[];
 for(let xx=x;xx<x+w;xx++){let first=h;for(let yy=0;yy<h;yy++){const a=pixels[((y+yy)*width+xx)*4+3];if(a<=8)transparent++;else if(first===h)first=yy;if(yy<3&&a>8)throw Error('Skyline needs a transparent top margin. No change applied.');}if(first<h)roofs.push(first);}
 if(transparent<w*h*.25)throw Error('Skyline background must remain transparent. No change applied.');
 if(roofs.length<20||Math.max(...roofs)-Math.min(...roofs)<4)throw Error('Skyline must have varied building silhouettes, not a background panel. No change applied.');
 for(let yy=3;yy<Math.floor(h*.8);yy++){let painted=0;for(let xx=x;xx<x+w;xx++)if(pixels[((y+yy)*width+xx)*4+3]>8)painted++;if(painted>w*.9)throw Error('Skyline contains an opaque horizontal band. No change applied.');}
}
