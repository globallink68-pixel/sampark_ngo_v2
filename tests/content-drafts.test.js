import {afterEach,expect,it,vi} from 'vitest';
import request from 'supertest';
import {sessionDatabase} from './helpers/session-database.js';
import bcrypt from 'bcryptjs';

const execute=vi.fn();
const mockExecute=sessionDatabase(execute);
const transaction={execute:vi.fn(),beginTransaction:vi.fn(),commit:vi.fn(),rollback:vi.fn(),release:vi.fn()};
vi.mock('../server/config/db.js',()=>({db:()=>({execute:mockExecute,getConnection:async()=>transaction})}));
const {createApp}=await import('../server/app.js');

afterEach(()=>vi.unstubAllEnvs());

it('keeps draft previews private and publishes the saved revision with an audit event',async()=>{
 const origin='http://localhost';
 vi.stubEnv('SESSION_SECRET','synthetic-test-key-for-content-drafts');
 const app=createApp({trustedOrigin:origin});
 const route='/api/admin/content/about/draft';
 expect((await request(app).get(route)).status).toBe(401);
 const agent=request.agent(app);
 execute.mockResolvedValueOnce([[{id:1,password_hash:await bcrypt.hash('test-password',4)}]]);
 expect((await agent.post('/api/auth/login').send({email:'admin@example.test',password:'test-password'})).status).toBe(200);
 const draft={title:'Updated about',body:'New description',kind:'setting'};
 const session=()=>execute.mockResolvedValueOnce([[{id:1}]]);
 session();
 expect((await agent.put(route).set('Origin',origin).send(draft)).status).toBe(204);
 expect(transaction.execute.mock.calls[0][0]).toContain('INSERT INTO content_drafts');
 execute.mockResolvedValueOnce([[{slug:'about',title:'Current about'}]]);
 expect((await request(app).get('/api/content/about')).body.title).toBe('Current about');
 session();
 execute.mockResolvedValueOnce([[draft]]);
 const preview=await agent.get(route);
 expect(preview.body).toEqual(draft);
 expect(preview.headers['cache-control']).toBe('no-store');
 session();
 expect((await agent.put(route).set('Origin','https://untrusted.example').send(draft)).status).toBe(403);
 session();
 transaction.execute.mockResolvedValueOnce([[{...draft,title:'Edited by another administrator'}]]);
 expect((await agent.post(route+'/publish').set('Origin',origin).send(draft)).status).toBe(409);
 expect(transaction.execute.mock.calls.some(([sql])=>sql.includes('INSERT INTO content_pages'))).toBe(false);
 session();
 transaction.execute.mockResolvedValueOnce([[draft]]);
 expect((await agent.post(route+'/publish').set('Origin',origin).send(draft)).status).toBe(204);
 expect(transaction.execute.mock.calls.some(([sql,params])=>sql.includes('audit_events')&&params.includes('content.publish'))).toBe(true);
 expect(transaction.commit).toHaveBeenCalledTimes(3);
});
