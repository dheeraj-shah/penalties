// Anonymous browser counts only: never store IPs, prompts, names, or auth tokens here.
export const TELEMETRY_SCHEMA = `CREATE TABLE IF NOT EXISTS browser_visits (browser_id TEXT PRIMARY KEY, first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL, notice_status TEXT NOT NULL DEFAULT 'pending'); CREATE INDEX IF NOT EXISTS browser_visits_seen ON browser_visits(last_seen);`;
export const RETENTION_MS = 7 * 86400000;
const COOKIE = '__Secure-penalties_browser';
const EXCLUDED = '__Secure-penalties_excluded';
const cookie = (name,value) => `${name}=${value}; Path=/penalties; Max-Age=604800; HttpOnly; Secure; SameSite=Strict`;
const readCookie = (request,name) => (request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);
const headers = {'Referrer-Policy':'same-origin','Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"};
export async function browserTelemetry(request,env,response,now=Date.now()) {
 const path=new URL(request.url).pathname;
 if (!env.DB || !['/penalties','/penalties/'].includes(path) || request.method!=='GET' || response.status!==200) return response;
 try {
  await env.DB.prepare('DELETE FROM browser_visits WHERE last_seen < ?').bind(now-RETENTION_MS).run();
  if(readCookie(request,EXCLUDED)==='1')return response;
  let id=readCookie(request,COOKIE);if(!/^[a-f0-9]{32}$/.test(id||''))id=crypto.randomUUID().replaceAll('-','');
  await env.DB.prepare('INSERT INTO browser_visits (browser_id,first_seen,last_seen) VALUES (?,?,?) ON CONFLICT(browser_id) DO UPDATE SET last_seen=excluded.last_seen').bind(id,now,now).run();
  const next=new Response(response.body,response);next.headers.append('Set-Cookie',cookie(COOKIE,id));return next;
 }catch{return response;} // Analytics must never prevent play; monitor reports read errors.
}
export async function telemetryPrivacy(request,env) {
 const url=new URL(request.url);if(url.pathname!=='/penalties/privacy')return null;
 if(request.method==='POST'){
  if(request.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers});
  const id=readCookie(request,COOKIE);
  try{if(/^[a-f0-9]{32}$/.test(id||''))await env.DB.prepare('DELETE FROM browser_visits WHERE browser_id=?').bind(id).run();}catch{return new Response('Could not remove this browser record. Please try again.',{status:503,headers});}
  const out=new Response(null,{status:303,headers:{...headers,Location:'/penalties/privacy'}});out.headers.append('Set-Cookie',cookie(EXCLUDED,'1').replace('Max-Age=604800','Max-Age=31536000'));out.headers.append('Set-Cookie',`${COOKIE}=; Path=/penalties; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);return out;
 }
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers});
 const excluded=readCookie(request,EXCLUDED)==='1';
 return new Response(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Anonymous browser counts</title><style>body{max-width:560px;margin:10vh auto;padding:24px;background:#101c18;color:#f2f7ef;font:16px system-ui;line-height:1.5}a{color:#d4f890}button{padding:12px;font:inherit}</style><h1>Anonymous browser counts</h1><p>After you enter the demo, a random browser ID and first/last visit times help Dheeraj know whether a new browser tried it. These counts store no names, IP addresses or prompts. Records expire after 7 days without a visit; the browser cookie lasts 7 days. A new browser record is not necessarily a new person.</p><p>${excluded?'This browser is excluded from counts for one year. Clearing cookies or using another browser resets this choice.':'You can exclude this browser and delete its count record.'}</p>${excluded?'':'<form method="post"><button type="submit">Exclude this browser</button></form>'}<p><a href="/penalties">Back to game</a></p></html>`,{headers});
}
