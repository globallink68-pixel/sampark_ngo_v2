import{afterEach,beforeEach,describe,it,expect,vi}from'vitest';
import request from'supertest';
import bcrypt from'bcryptjs';
import os from'node:os';
import fs from'node:fs/promises';
import path from'node:path';

const execute=vi.fn();
vi.mock('../server/config/db.js',()=>({db:()=>({execute})}));
process.env.SESSION_SECRET='h8-test-session-secret-at-least-32-characters';
const{createApp}=await import('../server/app.js');
let app,root;
const organization={organization_name:'Sampark Academy',tagline:'Community and possibility',short_description:'Learning and care.',address:'1 Main Street',city:'Pune',state:'Maharashtra',postal_code:'411001',primary_email:'hello@sampark.example',secondary_email:'',primary_phone:'+91 9876543210',secondary_phone:'',whatsapp_number:'+91 9876543210',facebook_url:'https://facebook.com/sampark',instagram_url:'https://instagram.com/sampark',youtube_url:'',linkedin_url:'',google_maps_url:'https://maps.google.com/?q=sampark',website_url:'https://sampark.example'};
beforeEach(async()=>{execute.mockReset();root=await fs.mkdtemp(path.join(os.tmpdir(),'sampark-h8-'));app=createApp({uploadRoot:root})});
afterEach(async()=>fs.rm(root,{recursive:true,force:true}));
const login=async()=>{execute.mockResolvedValueOnce([[{id:1,email:'admin@test.org',password_hash:await bcrypt.hash('strong-password-123',4)}]]);return (await request(app).post('/api/auth/login').send({email:'admin@test.org',password:'strong-password-123'})).headers['set-cookie'][0]};
const allow=()=>execute.mockResolvedValueOnce([[{id:1}]]);

describe('H8 organization settings',()=>{
  it('returns a public organization profile without internal fields and handles an empty singleton',async()=>{execute.mockResolvedValueOnce([[{...organization,internal_note:'do not expose',password_hash:'never'}]]);const response=await request(app).get('/api/organization');expect(response.status).toBe(200);expect(response.body).toMatchObject({organization_name:'Sampark Academy',primary_email:organization.primary_email});expect(response.body).not.toHaveProperty('internal_note');expect(response.body).not.toHaveProperty('password_hash');expect(execute.mock.calls[0][0]).not.toMatch(/password|secret|internal/i);execute.mockResolvedValueOnce([[]]);expect((await request(app).get('/api/organization')).body).toEqual({})});
  it('rejects anonymous administration reads and updates',async()=>{expect((await request(app).get('/api/admin/organization')).status).toBe(401);expect((await request(app).put('/api/admin/organization').send(organization)).status).toBe(401)});
  it('allows an authenticated admin to read existing organization settings',async()=>{const cookie=await login();allow();execute.mockResolvedValueOnce([[organization]]);expect((await request(app).get('/api/admin/organization').set('Cookie',cookie)).body).toEqual(organization)});
  it('updates the stable singleton with parameterized values rather than creating arbitrary records',async()=>{const cookie=await login();allow();execute.mockResolvedValueOnce([{}]);const response=await request(app).put('/api/admin/organization').set('Cookie',cookie).send(organization);expect(response.status).toBe(200);expect(response.body).toMatchObject({...organization,website_url:'https://sampark.example/'});const[sql,values]=execute.mock.calls.at(-1);expect(sql).toMatch(/^insert into organization_settings \(id,/);expect(sql).toMatch(/on duplicate key update/);expect(sql).not.toMatch(/where id=\?/);expect(values).toHaveLength(18);expect(values).not.toContain(99)});
  it('rejects invalid primary or secondary email addresses',async()=>{const cookie=await login();allow();expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send({...organization,primary_email:'not-an-email'})).status).toBe(400);allow();expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send({...organization,secondary_email:'broken'})).status).toBe(400)});
  it('rejects malformed social URLs and markup-bearing values',async()=>{const cookie=await login();allow();expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send({...organization,instagram_url:'javascript:alert(1)'})).status).toBe(400);allow();expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send({...organization,tagline:'<script>alert(1)</script>'})).status).toBe(400)});
  it('accepts blank optional social URLs and returns updated settings publicly',async()=>{const cookie=await login(),updated={...organization,facebook_url:'',instagram_url:'',youtube_url:'',linkedin_url:'',website_url:''};allow();execute.mockResolvedValueOnce([{}]);expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send(updated)).status).toBe(200);execute.mockResolvedValueOnce([[updated]]);expect((await request(app).get('/api/organization')).body).toEqual(updated)});
  it('leaves existing public APIs unaffected',async()=>{execute.mockResolvedValueOnce([[{id:1,title:'Existing gallery item'}]]);expect((await request(app).get('/api/gallery')).body).toEqual([{id:1,title:'Existing gallery item'}])});
});
