import {sessionDatabase} from './helpers/session-database.js';
import {it,expect,vi} from 'vitest';
import request from 'supertest';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
const execute=vi.fn();const mockExecute=sessionDatabase(execute);vi.mock('../server/config/db.js',()=>({db:()=>({execute:mockExecute})}));
const {createApp}=await import('../server/app.js');
it.each(['/api/donations/create-order','/api/donations/verify-payment','/api/webhooks/razorpay'].flatMap(url=>[{}, {amount:'0'},{amount:'100.001'}, {razorpay_order_id:'historical-order'}, {event:'payment.captured'}, {event:'payment.failed'}].map(body=>({url,body}))))('retired $url cannot mutate history for $body',async({url,body})=>{const root=await fs.mkdtemp(path.join(os.tmpdir(),'payment-hold-'));try{execute.mockReset();const provider=vi.fn();const app=createApp({uploadRoot:root,razorpay:{orders:{create:provider}}});expect((await request(app).post(url).send(body)).status).toBe(410);expect(execute).not.toHaveBeenCalled();expect(provider).not.toHaveBeenCalled()}finally{await fs.rm(root,{recursive:true,force:true})}});

