import {sessionDatabase} from './helpers/session-database.js';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import request from 'supertest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const execute=vi.fn();const mockExecute=sessionDatabase(execute);
vi.mock('../server/config/db.js',()=>({db:()=>({execute:mockExecute})}));
const {createApp}=await import('../server/app.js');
let root,app;
beforeEach(async()=>{execute.mockReset();root=await fs.mkdtemp(path.join(os.tmpdir(),'retired-'));app=createApp({uploadRoot:root,razorpay:{orders:{create:()=>{throw Error('Provider must never run')}}}})});
afterEach(async()=>fs.rm(root,{recursive:true,force:true}));
it.each(['/api/donations/create-order','/api/donations/verify-payment','/api/webhooks/razorpay','/api/subscriptions/create','/api/admin/subscriptions/1/cancel'])('retires %s before any database or provider operation',async url=>{
 const response=await request(app).post(url).send({amount:'500',name:'Synthetic',email:'synthetic@example.test',mobile:'9999999999'});
 expect(response.status).toBe(410);expect(execute).not.toHaveBeenCalled();
});
it('keeps financial records inaccessible without authentication',async()=>{expect((await request(app).get('/api/admin/donations')).status).toBe(401);expect(execute).not.toHaveBeenCalled()});

