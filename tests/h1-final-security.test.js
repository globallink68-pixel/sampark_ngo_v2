import{afterEach,beforeEach,describe,it,expect,vi}from'vitest';
import request from'supertest';
import bcrypt from'bcryptjs';
import os from'node:os';
import fs from'node:fs/promises';
import path from'node:path';

const execute=vi.fn();
vi.mock('../server/config/db.js',()=>({db:()=>({execute})}));
process.env.SESSION_SECRET='test-session-secret-at-least-32-characters';
const{createApp}=await import('../server/app.js');
let app,root;

beforeEach(async()=>{execute.mockReset();root=await fs.mkdtemp(path.join(os.tmpdir(),'sampark-csrf-'));app=createApp({uploadRoot:root,trustedOrigin:'https://admin.example.org'})});
afterEach(async()=>fs.rm(root,{recursive:true,force:true}));
const login=async()=>{execute.mockResolvedValueOnce([[{id:1,email:'admin@example.org',password_hash:await bcrypt.hash('strong-password-123',4)}]]);const response=await request(app).post('/api/auth/login').send({email:'admin@example.org',password:'strong-password-123'});return response.headers['set-cookie'][0]};

describe('H1 final same-origin admin protection',()=>{
  it('allows a legitimate same-origin admin mutation',async()=>{const cookie=await login();execute.mockResolvedValueOnce([[{id:1}]]).mockResolvedValueOnce([{insertId:4}]);const response=await request(app).post('/api/admin/gallery').set('Cookie',cookie).set('Origin','https://admin.example.org').field('title','Gallery');expect(response.status).toBe(201)});
  it('rejects a cross-origin authenticated mutation',async()=>{const cookie=await login();execute.mockResolvedValueOnce([[{id:1}]]);const response=await request(app).post('/api/admin/gallery').set('Cookie',cookie).set('Origin','https://attacker.example').field('title','Gallery');expect(response.status).toBe(403);expect(execute).toHaveBeenCalledTimes(2)});
  it('rejects a malformed origin',async()=>{const cookie=await login();execute.mockResolvedValueOnce([[{id:1}]]);expect((await request(app).delete('/api/admin/gallery/1').set('Cookie',cookie).set('Origin','not an origin')).status).toBe(403)});
  it('does not require an origin for normal admin GET requests',async()=>{const cookie=await login();execute.mockResolvedValueOnce([[{id:1}]]).mockResolvedValueOnce([[]]);expect((await request(app).get('/api/admin/donations').set('Cookie',cookie)).status).toBe(200)});
});
