import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const runtime=JSON.parse(await fs.readFile('.qa/runtime.json','utf8'));
const cwd=path.resolve('.qa/release-final');
const env={...process.env,NODE_ENV:'production',DB_HOST:'127.0.0.1',DB_PORT:'33379',DB_NAME:runtime.database,DB_USER:'root',DB_PASSWORD:'synthetic-local-only',SESSION_SECRET:'isolated-production-mode-synthetic-session-secret',APP_ORIGIN:'https://staging.example.test',PORT:'3027',UPLOAD_ROOT:runtime.uploadRoot};
const child=spawn(process.execPath,['server/server.js'],{cwd,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
const results=[];const check=async(name,fn)=>{await fn();results.push({name,status:'PASS'})};
try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3027/api/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 await check('production-mode isolated startup',async()=>assert.equal((await fetch('http://127.0.0.1:3027/api/health')).status,200));
 await check('built frontend and static image',async()=>{const r=await fetch('http://127.0.0.1:3027/');assert.equal(r.status,200);assert.match(await r.text(),/assets\/index-/);assert.equal((await fetch('http://127.0.0.1:3027/community.webp')).status,200)});
 await check('security headers',async()=>{const r=await fetch('http://127.0.0.1:3027/');assert.match(r.headers.get('content-security-policy'),/script-src/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.ok(r.headers.get('strict-transport-security'))});
 await check('secure production session cookie',async()=>{const r=await fetch('http://127.0.0.1:3027/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@example.test',password:'Synthetic-only-passphrase-2026'})});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/)});
 await check('retired production-mode payment endpoints',async()=>{for(const endpoint of ['donations/create-order','donations/verify-payment','webhooks/razorpay'])assert.equal((await fetch(`http://127.0.0.1:3027/api/${endpoint}`,{method:'POST'})).status,410)});
 await check('anonymous financial access denied',async()=>assert.equal((await fetch('http://127.0.0.1:3027/api/admin/donations')).status,401));
 await check('startup logs do not contain synthetic password',async()=>assert.ok(!logs.includes('synthetic-local-only')));
}finally{child.kill();await fs.writeFile('.qa/production-smoke.json',JSON.stringify({results,passed:results.length,logs},null,2));}
console.log(JSON.stringify({passed:results.length}));
