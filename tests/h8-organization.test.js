import {sessionDatabase} from './helpers/session-database.js';
import{afterEach,beforeEach,describe,it,expect,vi}from'vitest';
import request from'supertest';
import bcrypt from'bcryptjs';
import os from'node:os';
import fs from'node:fs/promises';
import path from'node:path';

const execute=vi.fn();const mockExecute=sessionDatabase(execute);
const getConnection=vi.fn();
vi.mock('../server/config/db.js',()=>({db:()=>({execute:mockExecute,getConnection})}));
process.env.SESSION_SECRET='h8-test-session-secret-at-least-32-characters';
const{createApp}=await import('../server/app.js');
let app,root;
const organization={organization_name:'Sampark Academy',tagline:'Community and possibility',short_description:'Learning and care.',address:'1 Main Street',city:'Pune',state:'Maharashtra',postal_code:'411001',primary_email:'hello@sampark.example',secondary_email:'',primary_phone:'+91 9876543210',secondary_phone:'',whatsapp_number:'+91 9876543210',facebook_url:'https://facebook.com/sampark',instagram_url:'https://instagram.com/sampark',youtube_url:'',linkedin_url:'',threads_url:'https://www.threads.net/@sampark',x_url:'https://x.com/sampark',google_maps_url:'https://maps.google.com/?q=sampark',website_url:'https://sampark.example'};
beforeEach(async()=>{execute.mockReset();root=await fs.mkdtemp(path.join(os.tmpdir(),'sampark-h8-'));app=createApp({uploadRoot:root})});
afterEach(async()=>fs.rm(root,{recursive:true,force:true}));
const login=async()=>{execute.mockResolvedValueOnce([[{id:1,email:'admin@test.org',password_hash:await bcrypt.hash('strong-password-123',4)}]]);return (await request(app).post('/api/auth/login').send({email:'admin@test.org',password:'strong-password-123'})).headers['set-cookie'][0]};
const allow=()=>execute.mockResolvedValueOnce([[{id:1}]]);

describe('H8 organization settings',()=>{
  it('saves a partial first draft without publishing and rejects a stale revision',async()=>{
    const route='/api/admin/organization/draft', cookie=await login();
    let draft;
    const connection={
      beginTransaction:vi.fn(),commit:vi.fn(),rollback:vi.fn(),release:vi.fn(),
      execute:vi.fn(async(sql,args)=>{
        if(sql.startsWith('SELECT title,body'))return [draft?[draft]:[]];
        if(sql.includes('FROM organization_settings'))return [[]];
        if(sql.startsWith('INSERT INTO content_drafts'))draft={title:args[1],body:args[2]};
        if(sql.startsWith('UPDATE content_drafts'))draft={title:args[0],body:args[1]};
        return [{}];
      })
    };
    getConnection.mockResolvedValue(connection);
    const put=body=>{allow();return request(app).put(route).set('Cookie',cookie).send(body)};
    const saved=await put({profile:{tagline:'First draft'}});
    expect(saved.status).toBe(200);
    allow();execute.mockResolvedValueOnce([[draft]]);
    expect((await request(app).get(route).set('Cookie',cookie)).body).toEqual(saved.body);
    execute.mockResolvedValueOnce([[]]);
    expect((await request(app).get('/api/organization')).body).toEqual({});
    const updated=await put({revision:saved.body.revision,profile:{tagline:'Newer draft'}});
    expect(updated.status).toBe(200);
    expect(updated.body.revision).not.toBe(saved.body.revision);
    expect((await put({revision:saved.body.revision,profile:{tagline:'Stale edit'}})).status).toBe(409);
    expect((await put({revision:updated.body.revision,profile:{primary_email:'invalid'}})).status).toBe(400);
    allow();
    expect((await request(app).post(route+'/publish').set('Cookie',cookie).send({revision:updated.body.revision})).status).toBe(400);
    expect(JSON.parse(draft.body).profile.tagline).toBe('Newer draft');
  });
  it('returns a sanitized 500 for a draft persistence failure',async()=>{
    const cookie=await login();
    allow();
    getConnection.mockRejectedValueOnce(new Error('private connection details'));
    const response=await request(app).put('/api/admin/organization/draft')
      .set('Cookie',cookie).send({profile:{tagline:'Pending'}});
    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/could not persist/);
    expect(response.text).not.toContain('private connection details');
  });
  it('returns a public organization profile without internal fields and handles an empty singleton',async()=>{execute.mockResolvedValueOnce([[{...organization,internal_note:'do not expose',password_hash:'never'}]]);const response=await request(app).get('/api/organization');expect(response.status).toBe(200);expect(response.body).toMatchObject({organization_name:'Sampark Academy',primary_email:organization.primary_email,threads_url:organization.threads_url,x_url:organization.x_url});expect(response.body).not.toHaveProperty('internal_note');expect(response.body).not.toHaveProperty('password_hash');expect(execute.mock.calls[0][0]).not.toMatch(/password|secret|internal/i);execute.mockResolvedValueOnce([[]]);expect((await request(app).get('/api/organization')).body).toEqual({})});
  it('rejects anonymous administration reads and updates',async()=>{expect((await request(app).get('/api/admin/organization')).status).toBe(401);expect((await request(app).put('/api/admin/organization').send(organization)).status).toBe(401)});
  it('allows an authenticated admin to read existing organization settings',async()=>{const cookie=await login();allow();execute.mockResolvedValueOnce([[organization]]);expect((await request(app).get('/api/admin/organization').set('Cookie',cookie)).body).toEqual(organization)});
  it('updates the stable singleton with parameterized values rather than creating arbitrary records',async()=>{const cookie=await login();allow();execute.mockResolvedValueOnce([{}]);const response=await request(app).put('/api/admin/organization').set('Cookie',cookie).send(organization);expect(response.status).toBe(200);expect(response.body).toMatchObject({...organization,website_url:'https://sampark.example/'});const[sql,values]=execute.mock.calls.at(-1);expect(sql).toMatch(/^insert into organization_settings \(id,/);expect(sql).toMatch(/on duplicate key update/);expect(sql).not.toMatch(/where id=\?/);expect(values).toHaveLength(20);expect(values).not.toContain(99)});
  it('rejects invalid primary or secondary email addresses',async()=>{const cookie=await login();allow();expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send({...organization,primary_email:'not-an-email'})).status).toBe(400);allow();expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send({...organization,secondary_email:'broken'})).status).toBe(400)});
  it('rejects malformed social URLs and markup-bearing values',async()=>{const cookie=await login();for(const field of['instagram_url','threads_url','x_url']){allow();expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send({...organization,[field]:'javascript:alert(1)'})).status).toBe(400)}allow();expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send({...organization,tagline:'<script>alert(1)</script>'})).status).toBe(400)});
  it('accepts blank optional social URLs and returns updated settings publicly',async()=>{const cookie=await login(),updated={...organization,facebook_url:'',instagram_url:'',youtube_url:'',linkedin_url:'',threads_url:'',x_url:'',website_url:''};allow();execute.mockResolvedValueOnce([{}]);expect((await request(app).put('/api/admin/organization').set('Cookie',cookie).send(updated)).status).toBe(200);execute.mockResolvedValueOnce([[updated]]);expect((await request(app).get('/api/organization')).body).toEqual(updated)});
  it('leaves existing public APIs unaffected',async()=>{execute.mockResolvedValueOnce([[{id:1,title:'Existing gallery item'}]]);expect((await request(app).get('/api/gallery')).body).toEqual([{id:1,title:'Existing gallery item'}])});
});

