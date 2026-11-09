import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';
import {expect,it} from 'vitest';
import {configureTrustedProxy} from '../server/config/trusted-proxy.js';

function appFor(peers){
 const app=express();
 configureTrustedProxy(app,peers);
 app.get('/',rateLimit({limit:2,windowMs:60000}), (req,res)=>res.json({ip:req.ip}));
 return app;
}

it('uses only the final forwarded address from an allowlisted socket peer',async()=>{
 const app=appFor('127.0.0.1/32, ::1');
 const send=xff=>request(app).get('/').set('X-Forwarded-For',xff);
 expect((await send('198.51.100.6, 203.0.113.1')).body.ip).toBe('203.0.113.1');
 expect((await send('198.51.100.7, 203.0.113.1')).status).toBe(200);
 expect((await send('198.51.100.8, 203.0.113.1')).status).toBe(429);
 expect((await send('198.51.100.8, 203.0.113.2')).status).toBe(200);
});

it.each(['','192.0.2.10'])('ignores spoofed forwarding from an untrusted direct peer (%s)',async peers=>{
 const app=appFor(peers);
 const send=xff=>request(app).get('/').set('X-Forwarded-For',xff);
 const first=await send('203.0.113.1');
 expect(first.body.ip).toMatch(/127\.0\.0\.1|^::1$/);
 expect((await send('203.0.113.2')).status).toBe(200);
 expect((await send('203.0.113.3')).status).toBe(429);
});

it.each(['true','1','loopback','0.0.0.0/0','::/0','192.0.2.1/33'])('rejects unsafe or malformed proxy configuration (%s)',value=>{
 expect(()=>appFor(value)).toThrow(/TRUSTED_PROXY_PEERS/);
});
