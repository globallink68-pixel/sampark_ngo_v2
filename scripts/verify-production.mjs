import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import net from 'node:net';
import {once} from 'node:events';
import {pathToFileURL} from 'node:url';
import mysql from 'mysql2/promise';
import {validateEnvironment} from '../server/config/validate-env.js';
import {waitForReadiness} from './lib/readiness.mjs';
const runtime=JSON.parse(await fs.readFile('.qa/runtime.json','utf8'));
const cwd=path.resolve('.qa/release-final');
assert.match(runtime.database,/^sampark_verify_\d+$/);
await Promise.all(['server/server.js','server/app.js','dist/index.html','package.json'].map(file=>fs.access(path.join(cwd,file))));
const listener=net.createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
const env={...process.env,NODE_ENV:'production',DB_HOST:'127.0.0.1',DB_PORT:'33379',DB_NAME:runtime.database,DB_USER:'root',DB_PASSWORD:'synthetic-local-only',SESSION_SECRET:'isolated-production-mode-synthetic-session-secret',APP_ORIGIN:'https://staging.example.test',PORT:String(port),UPLOAD_ROOT:runtime.uploadRoot};
validateEnvironment(env);
const dbStarted=Date.now();const database=await mysql.createConnection({host:env.DB_HOST,port:Number(env.DB_PORT),database:env.DB_NAME,user:env.DB_USER,password:env.DB_PASSWORD,connectTimeout:5000});
try{await database.query('SET TRANSACTION READ ONLY');await database.query('START TRANSACTION READ ONLY');await database.query('SELECT 1');await database.rollback();}finally{await database.end();}
const dbProbeMs=Date.now()-dbStarted;
const probe=path.resolve('.qa/startup-probe.mjs');
await fs.writeFile(probe,"import net from 'node:net';import {performance} from 'node:perf_hooks';import {loopbackListenArgs} from "+JSON.stringify(new URL('./lib/readiness.mjs',import.meta.url).href)+";const start=performance.now();const mark=(phase,extra={})=>process.send?.({tag:'sampark-smoke-startup',phase,elapsed_ms:performance.now()-start,...extra});mark('preload');const original=net.Server.prototype.listen;net.Server.prototype.listen=function(...args){mark('listen-called');this.once('listening',()=>{const address=this.address();if(address.address!=='127.0.0.1')throw Error('Non-loopback verification binding');mark('listening',{bound_address:address.address})});return original.apply(this,loopbackListenArgs(args))};");
const started=Date.now();
const child=spawn(process.execPath,['--import',pathToFileURL(probe).href,'server/server.js'],{cwd,env,stdio:['ignore','pipe','pipe','ipc'],windowsHide:true});
let logs='',spawnError,readiness;const phases=[];child.on('spawn',()=>phases.push({phase:'spawned',parent_elapsed_ms:Date.now()-started}));child.on('message',message=>{if(message.tag==='sampark-smoke-startup')phases.push({phase:message.phase,parent_elapsed_ms:Date.now()-started,child_elapsed_ms:message.elapsed_ms,...(message.bound_address?{bound_address:message.bound_address}:{})})});child.on('error',e=>{spawnError=e.code||e.name});child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
const base=`http://127.0.0.1:${port}`;
const request=(route,options={})=>fetch(base+route,{...options,signal:AbortSignal.timeout(5000)});
const results=[];const check=async(name,fn)=>{await fn();results.push({name,status:'PASS'})};
try{
 readiness=await waitForReadiness(child,base+'/api/health',{getSpawnError:()=>spawnError});
 await check('production-mode isolated startup',async()=>assert.equal((await request('/api/health')).status,200));
 await check('built frontend and static image',async()=>{const r=await request('/');assert.equal(r.status,200);assert.match(await r.text(),/assets\/index-/);assert.equal((await request('/community.webp')).status,200)});
 await check('security headers',async()=>{const r=await request('/');assert.match(r.headers.get('content-security-policy'),/script-src/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.ok(r.headers.get('strict-transport-security'))});
 await check('secure production session cookie',async()=>{const r=await request('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@example.test',password:'Synthetic-only-passphrase-2026'})});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/)});
 await check('retired production-mode payment endpoints',async()=>{for(const endpoint of ['donations/create-order','donations/verify-payment','webhooks/razorpay'])assert.equal((await request('/api/'+endpoint,{method:'POST'})).status,410)});
 await check('anonymous financial access denied',async()=>assert.equal((await request('/api/admin/donations')).status,401));
 await check('startup logs do not contain synthetic password',async()=>assert.ok(!logs.includes('synthetic-local-only')));
}finally{
 const runningAtCleanup=child.exitCode===null&&!child.signalCode;
 if(runningAtCleanup&&child.pid){const exited=once(child,'exit');child.kill();await exited;}
 await fs.writeFile('.qa/production-smoke.json',JSON.stringify({results,passed:results.length,readiness,phases,database_probe_ms:dbProbeMs,suite_total_elapsed_ms:Date.now()-started,running_before_cleanup:runningAtCleanup,spawn_error:spawnError||null,environment_validation:'PASS; values not logged',synthetic_database:runtime.database,database_host_class:'loopback, port33379',candidate_working_directory:cwd,entry:'server/server.js',production_access:false,logs},null,2));
}
console.log(JSON.stringify({passed:results.length,readiness,phases,database_probe_ms:dbProbeMs}));
