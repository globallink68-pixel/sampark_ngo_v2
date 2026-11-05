import {sessionDatabase} from './helpers/session-database.js';
import {it,expect,vi} from 'vitest';
import request from 'supertest';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
const execute=vi.fn();const mockExecute=sessionDatabase(execute);vi.mock('../server/config/db.js',()=>({db:()=>({execute:mockExecute})}));
const {createApp}=await import('../server/app.js');
it('accepts a consented application as a separate private workflow',async()=>{const root=await fs.mkdtemp(path.join(os.tmpdir(),'flow-'));try{const app=createApp({uploadRoot:root});execute.mockResolvedValueOnce([{insertId:1}]);const r=await request(app).post('/api/applications/volunteer').send({name:'Synthetic applicant',email:'qa@example.test',message:'I would like to volunteer.',consent:true});expect(r.status).toBe(201);expect(execute.mock.calls[0][0]).toContain('applications');expect(r.body).not.toHaveProperty('email')}finally{await fs.rm(root,{recursive:true,force:true})}});
it('does not publish applications or unsupported receipt records',async()=>{const root=await fs.mkdtemp(path.join(os.tmpdir(),'flow-'));try{const app=createApp({uploadRoot:root});expect((await request(app).get('/api/applications')).status).toBe(404);expect((await request(app).get('/api/receipts/1')).status).toBe(404)}finally{await fs.rm(root,{recursive:true,force:true})}});

