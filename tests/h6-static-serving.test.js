import{afterEach,beforeEach,describe,it,expect,vi}from'vitest';
import request from'supertest';
import os from'node:os';
import fs from'node:fs/promises';
import path from'node:path';

const execute=vi.fn();
vi.mock('../server/config/db.js',()=>({db:()=>({execute})}));
const{createApp}=await import('../server/app.js');
let root,app,distRoot,uploadRoot;

beforeEach(async()=>{execute.mockReset();root=await fs.mkdtemp(path.join(os.tmpdir(),'sampark-h6-'));distRoot=path.join(root,'dist');uploadRoot=path.join(root,'uploads');await fs.mkdir(path.join(distRoot,'assets'),{recursive:true});await fs.mkdir(path.join(uploadRoot,'gallery'),{recursive:true});await fs.writeFile(path.join(distRoot,'index.html'),'<!doctype html><html><body><div id="root">Vite test app</div></body></html>');await fs.writeFile(path.join(distRoot,'assets','app.js'),'window.viteTest=true;');await fs.writeFile(path.join(uploadRoot,'gallery','image.txt'),'upload fixture');app=createApp({distRoot,uploadRoot})});
afterEach(async()=>fs.rm(root,{recursive:true,force:true}));

describe('H6 Vite static serving',()=>{
  it('serves the Vite index page for GET / when dist exists',async()=>{const response=await request(app).get('/');expect(response.status).toBe(200);expect(response.text).toContain('Vite test app')});
  it('serves the index page for React SPA routes',async()=>{const response=await request(app).get('/gallery');expect(response.status).toBe(200);expect(response.text).toContain('Vite test app')});
  it('serves built static assets without using the SPA fallback',async()=>{const response=await request(app).get('/assets/app.js');expect(response.status).toBe(200);expect(response.text).toContain('viteTest=true')});
  it('keeps existing API routes ahead of the SPA fallback',async()=>{execute.mockResolvedValueOnce([[{id:1,title:'Gallery'}]]);const response=await request(app).get('/api/gallery');expect(response.status).toBe(200);expect(response.body).toEqual([{id:1,title:'Gallery'}]);expect(response.text).not.toContain('Vite test app')});
  it('never converts unknown API requests into SPA HTML',async()=>{const response=await request(app).get('/api/not-a-route');expect(response.status).toBe(404);expect(response.text).not.toContain('Vite test app')});
  it('preserves uploads static serving',async()=>{const response=await request(app).get('/uploads/gallery/image.txt');expect(response.status).toBe(200);expect(response.text).toBe('upload fixture')});
  it('returns a safe 404 for frontend routes when the dist directory is absent',async()=>{const missing=createApp({distRoot:path.join(root,'missing-dist'),uploadRoot:path.join(root,'other-uploads')});const response=await request(missing).get('/');expect(response.status).toBe(404);expect(response.text).not.toContain('Vite test app')});
});
