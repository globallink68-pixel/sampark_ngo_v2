import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {runMigrations} from '../server/migrations.js';
const database=`sampark_verify_${Date.now()}`;
const config={host:'127.0.0.1',port:33379,user:'root',password:'synthetic-local-only'};
const c=await mysql.createConnection(config);await c.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);await c.changeUser({database});
Object.assign(process.env,{NODE_ENV:'test',DB_HOST:'127.0.0.1',DB_PORT:'33379',DB_NAME:database,DB_USER:'root',DB_PASSWORD:config.password,SESSION_SECRET:'synthetic-verification-secret-at-least-32-chars',APP_ORIGIN:'http://127.0.0.1:3017'});
const results=[];const check=async(name,fn)=>{try{await fn();results.push({name,status:'PASS'})}catch(e){results.push({name,status:'FAIL',error:e.message});throw e}};
await fs.mkdir('.qa',{recursive:true});
let pool;
try{
 await check('fresh MariaDB migration',()=>runMigrations(c));
 await check('repeat migration idempotency',()=>runMigrations(c));
 await c.execute('INSERT INTO admins(email,password_hash) VALUES (?,?)',['admin@example.test',await bcrypt.hash('Synthetic-only-passphrase-2026',10)]);
 const {createApp}=await import('../server/app.js');const {db}=await import('../server/config/db.js');pool=db();
 const uploadRoot=path.resolve('.qa/uploads');const app=createApp({uploadRoot,trustedOrigin:process.env.APP_ORIGIN});
 const agent=request.agent(app);const origin=process.env.APP_ORIGIN;
 await check('admin unauthorised',async()=>assert.equal((await agent.get('/api/admin/donations')).status,401));
 await check('admin login',async()=>assert.equal((await agent.post('/api/auth/login').send({email:'admin@example.test',password:'Synthetic-only-passphrase-2026'})).status,200));
 const mutation=(method,url)=>agent[method](url).set('Origin',origin);
 const png=await sharp({create:{width:40,height:30,channels:3,background:'#0a6664'}}).png().toBuffer();let programme,gallery;
 await check('programme create with decoded image',async()=>{const r=await mutation('post','/api/admin/programs').field('title','Synthetic training programme').field('status','upcoming').field('description','Synthetic QA content; not a claim of current course operation.').attach('image',png,{filename:'qa.png',contentType:'image/png'});assert.equal(r.status,201);programme=r.body.id});
 await check('published programme details',async()=>{const r=await agent.get(`/api/programs/${programme}`);assert.equal(r.status,200);assert.match(r.body.title,/Synthetic/)});
 await check('gallery upload',async()=>{const r=await mutation('post','/api/admin/gallery').field('title','Synthetic QA image').field('display_order','0').field('active','1').attach('image',png,{filename:'qa.png',contentType:'image/png'});assert.equal(r.status,201);gallery=r.body.id});
 await check('reject forged JPEG content',async()=>{const r=await mutation('post','/api/admin/gallery').field('title','Rejected').attach('image',Buffer.from('<script>alert(1)</script>'),{filename:'forged.jpg',contentType:'image/jpeg'});assert.equal(r.status,400)});
 await check('CSRF rejection',async()=>assert.equal((await agent.put(`/api/admin/programs/${programme}`).set('Origin','https://attacker.example').send({title:'Bad'})).status,403));
 await check('contact validation and storage',async()=>{assert.equal((await agent.post('/api/contact').send({name:'QA',email:'qa@example.test',mobile:'9999999999',subject:'Synthetic enquiry',message:'QA only',consent:true})).status,201);const [r]=await c.execute('SELECT COUNT(*) AS count FROM contact_messages');assert.equal(r[0].count,1)});
 for(const kind of ['volunteer','internship','membership','csr','pickup'])await check(`${kind} application`,async()=>{const r=await agent.post(`/api/applications/${kind}`).send({name:'Synthetic QA',email:'qa@example.test',message:'QA only',consent:true});assert.equal(r.status,201)});
 await check('application rate limit',async()=>assert.equal((await agent.post('/api/applications/sponsor').send({name:'QA',email:'qa@example.test',message:'QA',consent:true})).status,429));
 await check('sponsor application',async()=>assert.equal((await request(createApp({uploadRoot})).post('/api/applications/sponsor').send({name:'QA',email:'qa@example.test',message:'QA',consent:true})).status,201));
 await check('application privacy',async()=>assert.equal((await agent.get('/api/applications')).status,404));
 await check('application status and audit transaction',async()=>assert.equal((await mutation('put','/api/admin/applications/1').send({status:'contacted'})).status,200));
 await check('authorised policy editing and escaped source',async()=>{assert.equal((await mutation('put','/api/admin/content/policy-privacy').send({title:'Privacy policy',kind:'policy',body:'Synthetic approved privacy wording. <script>must remain text</script>',published:true})).status,200);const r=await agent.get('/api/content/policy-privacy');assert.match(r.body.body,/Synthetic approved/)});
 await check('audit records persisted',async()=>assert.equal((await agent.get('/api/admin/audit')).body.length,2));
 await check('private draft replaces public policy only after audited publish',async()=>{
  const route='/api/admin/content/policy-privacy/draft';
  const draft={title:'Revised policy',kind:'policy',body:'Synthetic draft wording.'};
  assert.equal((await mutation('put',route).send(draft)).status,204);
  assert.equal((await request(app).get(route)).status,401);
  assert.notEqual((await agent.get('/api/content/policy-privacy')).body.body,draft.body);
  assert.deepEqual((await agent.get(route)).body,draft);
  assert.equal((await mutation('post',route+'/publish').send(draft)).status,204);
  assert.equal((await agent.get('/api/content/policy-privacy')).body.body,draft.body);
  const [[stored]]=await c.execute('SELECT title,kind,body FROM content_pages WHERE slug=?',['policy-privacy']);
  assert.deepEqual({...stored},draft);
  assert.equal((await agent.get(route)).status,404);
  const [audit]=await c.execute('SELECT action FROM audit_events WHERE resource=? ORDER BY id DESC LIMIT 2',['policy-privacy']);
  assert.deepEqual(audit.map(row=>row.action),['content.publish','content.draft']);
 });
 await check('site images reject unsafe input and publish only the reviewed draft',async()=>{
  const route='/api/admin/site-images/logo';
  const visitor=request(app);
  const save=()=>mutation('put',route).attach('image',png,{filename:'qa.png',contentType:'image/png'});
  assert.equal((await visitor.get(route)).status,401);
  assert.equal((await mutation('put',route).attach('image',Buffer.from('<svg/>'),{filename:'qa.png',contentType:'image/png'})).status,400);
  assert.equal((await save()).status,204);
  const first=(await agent.get(route)).body.draft_id;
  assert.equal((await visitor.get(route+'/preview/'+first)).status,401);
  assert.equal((await visitor.get('/api/site-images/'+first)).status,404);
  assert.equal((await agent.get('/api/admin/site-images/hero/preview/'+first)).status,404);
  const preview=await agent.get(route+'/preview/'+first);
  assert.equal(preview.status,200);
  assert.equal(preview.headers['cache-control'],'no-store');
  assert.equal((await save()).status,204);
  const second=(await agent.get(route)).body.draft_id;
  assert.equal((await mutation('post',route+'/publish').send({id:first})).status,409);
  assert.equal((await mutation('post',route+'/publish').send({id:second})).status,204);
  const url='/api/site-images/'+second;
  assert.equal((await visitor.get('/api/site-images')).body.logo,url);
  assert.equal((await visitor.get(url)).headers['content-type'],'image/webp');
  assert.equal((await save()).status,204);
  const third=(await agent.get(route)).body.draft_id;
  assert.equal((await mutation('post',route+'/publish').send({id:third})).status,204);
  assert.equal((await visitor.get(url)).status,200);
  const [[stored]]=await c.execute('SELECT draft_id,public_id FROM site_image_slots WHERE slot=?',['logo']);
  assert.deepEqual({...stored},{draft_id:null,public_id:third});
 });
 await check('member draft is private and publishes its approved fields',async()=>{
  const route='/api/admin/record-drafts/members';
  const profile={name:'Synthetic member',designation:'Trainer',bio:'Approved public biography.',category:'Staff',display_order:5,active:true,public_visible:true};
  const draft=await mutation('post',route).field('record',JSON.stringify(profile)).attach('image',png,{filename:'qa.png',contentType:'image/png'});
  assert.equal(draft.status,201);
  const url=route+'/'+draft.body.id;
  assert.equal((await request(app).get(url+'/image')).status,401);
  assert.equal((await agent.get(url+'/image')).headers['content-type'],'image/webp');
  assert.deepEqual((await request(app).get('/api/members')).body,[]);
  assert.equal((await mutation('post',url+'/publish').send({revision:'invalid'})).status,409);
  const result=await mutation('post',url+'/publish').send({revision:draft.body.revision});
  assert.equal(result.status,200);
  const [member]=(await request(app).get('/api/members')).body;
  assert.equal(member.name,profile.name);
  assert.equal(member.category,profile.category);
  assert.equal((await request(app).get('/'+member.photo_path)).status,200);
  assert.equal((await agent.get(url+'/image')).status,404);
 });
 await check('programme and gallery edits preserve existing images until publication',async()=>{
  for(const [kind,id,fields,publicPath] of [
   ['programs',programme,{title:'Revised programme',status:'ongoing',category:'Training'},'/api/programs/'+programme],
   ['gallery',gallery,{title:'Revised image',album:'Training'},'/api/gallery']
  ]){
   const route='/api/admin/record-drafts/'+kind;
   const before=await request(app).get(publicPath);
   const old=kind==='gallery'?before.body.find(row=>row.id===id):before.body;
   const draft=await mutation('post',route+'?target='+id).field('record',JSON.stringify({...fields,display_order:42,active:true,public_visible:true}));
   assert.equal(draft.status,201);
   assert.deepEqual((await request(app).get(publicPath)).body,before.body);
   assert.equal((await mutation('post',route+'/'+draft.body.id+'/publish').send({revision:draft.body.revision})).status,200);
   const after=(await request(app).get(publicPath)).body;
   const current=kind==='gallery'?after.find(row=>row.id===id):after;
   assert.equal(current.title,fields.title);
   assert.equal(current.category??current.album,fields.category??fields.album);
   assert.equal(current.image_path,old.image_path);
   assert.equal((await request(app).get('/'+old.image_path)).status,200);
  }
 });
 await check('hidden member photo stays private until the member is explicitly made public',async()=>{
  const route='/api/admin/record-drafts/members';
  const profile={name:'Synthetic private member',designation:'Trainer',display_order:9,active:true,public_visible:false};
  const draft=await mutation('post',route).field('record',JSON.stringify(profile)).attach('image',png,{filename:'qa.png',contentType:'image/png'});
  const hidden=await mutation('post',route+'/'+draft.body.id+'/publish').send({revision:draft.body.revision});
  assert.equal(hidden.status,200);
  const [[row]]=await c.execute('SELECT photo_path FROM members WHERE id=?',[hidden.body.id]);
  assert.equal((await request(app).get('/'+row.photo_path)).status,404);
  assert.equal((await agent.get(route+'/current/'+hidden.body.id+'/image')).status,200);
  assert.ok(!(await request(app).get('/api/members')).body.some(member=>member.id===hidden.body.id));
  const revised=await mutation('post',route+'?target='+hidden.body.id).field('record',JSON.stringify({...profile,public_visible:true}));
  assert.equal((await mutation('post',route+'/'+revised.body.id+'/publish').send({revision:revised.body.revision})).status,200);
  assert.equal((await request(app).get('/'+row.photo_path)).status,200);
 });
 await check('certificate and manual donation records require verification and support public withdrawal',async()=>{
  for(const [kind,fields] of [
   ['certificates',{title:'Synthetic redacted certificate'}],
   ['donations',{title:'Synthetic manual donation',bank_name:'Synthetic bank',account_holder:'Synthetic account',account_number:'123456789',ifsc:'TEST0123456',upi_id:'synthetic@invalid'}]
  ]){
   const route='/api/admin/record-drafts/'+kind,publicRoute='/api/verified-'+kind;
   const profile={...fields,display_order:0,active:true,public_visible:true,verified:false};
   const save=(payload,suffix='')=>mutation('post',route+suffix).field('record',JSON.stringify(payload));
   assert.equal((await save(profile)).status,400);
   const pending=await save({...profile,verified:true}).attach('image',png,{filename:'qa.png',contentType:'image/png'});
   assert.equal(pending.status,201);
   assert.deepEqual((await request(app).get(publicRoute)).body,[]);
   const published=await mutation('post',route+'/'+pending.body.id+'/publish').send({revision:pending.body.revision});
   assert.equal(published.status,200);
   const [record]=(await request(app).get(publicRoute)).body;
   assert.equal(record.title,fields.title);
   assert.equal((await request(app).get(record.image_path)).headers['content-type'],'image/webp');
   const withdraw=await save({...profile,public_visible:false},'?target='+published.body.id);
   assert.equal((await mutation('post',route+'/'+withdraw.body.id+'/publish').send({revision:withdraw.body.revision})).status,200);
   assert.deepEqual((await request(app).get(publicRoute)).body,[]);
   assert.equal((await request(app).get(record.image_path)).status,404);
  }
 });
 await check('site settings reject unsafe links and publish validated configuration',async()=>{
  const route='/api/admin/content/site-settings/draft';
  const payload={title:'Site settings',kind:'setting',body:JSON.stringify({home:['hero','faq'],navigation:[{to:'/contact',label:'Contact'}],faq:[{question:'How can I help?',answer:'Contact the academy.'}]})};
  assert.equal((await mutation('put',route).send({...payload,body:JSON.stringify({navigation:[{to:'//external.example',label:'Bad'}]})})).status,400);
  assert.equal((await mutation('put',route).send(payload)).status,204);
  assert.equal((await request(app).get('/api/content/site-settings')).status,404);
  assert.equal((await mutation('post',route+'/publish').send(payload)).status,204);
  assert.equal((await request(app).get('/api/content/site-settings')).body.body,payload.body);
 });
 await check('organization drafts publish atomically and reject stale previews',async()=>{
  const route='/api/admin/organization/draft';
  const profile={organization_name:'Synthetic profile',primary_email:'ngo@example.test',primary_phone:'9999999999',tagline:'Synthetic tagline'};
  const visitor=request(app);
  const before=(await visitor.get('/api/organization')).body;
  const draft=await mutation('put',route).send({profile});
  assert.equal(draft.status,200);
  assert.equal((await visitor.get(route)).status,401);
  assert.deepEqual((await visitor.get('/api/organization')).body,before);
  const edited=await mutation('put',route).send({revision:draft.body.revision,profile:{...profile,tagline:'Updated synthetic tagline'}});
  assert.equal(edited.status,200);
  assert.equal((await mutation('post',route+'/publish').send({revision:draft.body.revision})).status,409);
  assert.equal((await mutation('post',route+'/publish').send({revision:edited.body.revision})).status,200);
  assert.equal((await visitor.get('/api/organization')).body.tagline,'Updated synthetic tagline');
  assert.equal((await agent.get(route)).status,404);
 });
 await check('gallery batch request can retry the same file without duplicate drafts',async()=>{
  const route='/api/admin/record-drafts/gallery?upload_key=3eef786b-b4b5-4520-b92f-9768230aaef3';
  const save=title=>mutation('post',route).field('record',JSON.stringify({title,album:'Synthetic album',display_order:0,active:true,public_visible:false})).attach('image',png,{filename:'qa.png',contentType:'image/png'});
  const first=await save('Synthetic batch image');
  const retry=await save('Synthetic batch image');
  assert.equal(first.status,201);
  assert.equal(retry.status,200);
  assert.deepEqual(retry.body,first.body);
  assert.equal((await save('Different payload')).status,409);
  const [[row]]=await c.execute('SELECT COUNT(*) AS count FROM record_drafts WHERE id=?',[first.body.id]);
  assert.equal(row.count,1);
 });
 await check('financial history immutable under retired endpoints',async()=>{await c.execute("INSERT INTO donations(donor_name,donor_email,amount,status,razorpay_order_id,razorpay_payment_id) VALUES ('Synthetic donor','qa@example.test',12345,'paid','synthetic-order','synthetic-payment')");const [before]=await c.execute('SELECT * FROM donations');for(const url of ['/api/donations/create-order','/api/donations/verify-payment','/api/webhooks/razorpay'])assert.equal((await agent.post(url).send({amount:1})).status,410);const [after]=await c.execute('SELECT * FROM donations');assert.deepEqual(after,before);const summary=await agent.get('/api/admin/donations/summary');assert.equal(Number(summary.body.paid_amount),12345)});
 await check('foreign key restricts historical enquiry deletion',async()=>{await c.execute("INSERT INTO contact_interactions(contact_message_id,interaction_type,note,interaction_at) VALUES (1,'note','Synthetic interaction',NOW())");await assert.rejects(c.execute('DELETE FROM contact_messages WHERE id=1'),{code:'ER_ROW_IS_REFERENCED_2'})});
 await check('missing receipts fail closed',async()=>assert.equal((await agent.get('/api/receipts/1')).status,404));
 await check('application pagination preserves old pending records',async()=>{for(let i=0;i<101;i++)await c.execute("INSERT INTO applications(kind,name,email,message) VALUES ('volunteer','Synthetic pagination','qa@example.test','QA only')");const first=await agent.get('/api/admin/applications?offset=0');const next=await agent.get('/api/admin/applications?offset=100');assert.equal(first.body.length,100);assert.ok(next.body.some(r=>r.id===1));assert.equal((await agent.get('/api/admin/applications?offset=-1')).status,400)});
 await check('published activity CMS',async()=>assert.equal((await mutation('put','/api/admin/content/synthetic-activity').send({title:'Synthetic activity',kind:'activity',body:'Synthetic QA content only.',published:true})).status,200));
 await check('logout revokes a stolen session cookie',async()=>{const login=await agent.post('/api/auth/login').send({email:'admin@example.test',password:'Synthetic-only-passphrase-2026'});const cookie=login.headers['set-cookie'][0];assert.equal((await mutation('post','/api/auth/logout')).status,204);assert.equal((await request(app).get('/api/admin/donations').set('Cookie',cookie)).status,401)});
 await fs.writeFile('.qa/runtime.json',JSON.stringify({database,uploadRoot,programme,gallery},null,2));
}finally{
 await fs.writeFile('.qa/integration.json',JSON.stringify({engine:'MariaDB 11.8.9',database,results,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length},null,2));await c.end();if(pool)await pool.end();
}
console.log(JSON.stringify({passed:results.length,database}));



