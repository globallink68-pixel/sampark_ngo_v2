import rateLimit from 'express-rate-limit';
import {db} from './config/db.js';
import {admin} from './middleware/auth.js';
const kinds=['volunteer','internship','membership','csr','pickup','sponsor'];
const text=(value,max)=>typeof value==='string'&&value.trim().length<=max?value.trim():null;
export function workflows(app,sameOrigin){
 app.get('/api/health',(_r,s)=>s.json({status:'ok',payments:'retired'}));
 app.post('/api/applications/:kind',rateLimit({windowMs:60000,limit:5}),async(r,s)=>{
  const name=text(r.body.name,120),email=text(r.body.email,254),message=text(r.body.message,5000),mobile=text(r.body.mobile??'',30);
  if(!kinds.includes(r.params.kind)||!name||!email||!/^\S+@\S+\.\S+$/.test(email)||!message||mobile===null||r.body.consent!==true||r.body.website)return s.status(400).json({error:'Check your details and consent.'});
  await db().execute('INSERT INTO applications(kind,name,email,mobile,message) VALUES (?,?,?,?,?)',[r.params.kind,name,email,mobile||null,message]);
  s.status(201).json({ok:true});
 });
 app.get('/api/admin/applications',admin,async(r,s)=>{const offset=Number(r.query.offset||0);if(!Number.isSafeInteger(offset)||offset<0||offset>10000000)return s.sendStatus(400);return s.json((await db().execute('SELECT id,kind,name,email,mobile,message,status,consent_at,created_at FROM applications ORDER BY id DESC LIMIT 100 OFFSET ?',[offset]))[0])});
 app.put('/api/admin/applications/:id',admin,sameOrigin,async(r,s)=>{
  if(!['new','contacted','accepted','closed'].includes(r.body.status)||!/^\d+$/.test(r.params.id))return s.sendStatus(400);
  const connection=await db().getConnection();
  try{await connection.beginTransaction();const [result]=await connection.execute('UPDATE applications SET status=? WHERE id=?',[r.body.status,r.params.id]);if(!result.affectedRows){await connection.rollback();return s.sendStatus(404)}await connection.execute('INSERT INTO audit_events(admin_id,action,resource) VALUES (?,?,?)',[r.admin.id,'application.status',r.params.id]);await connection.commit();s.json({ok:true})}catch(error){await connection.rollback();throw error}finally{connection.release()}
 });
 app.get('/api/content',async(r,s)=>s.json((await db().execute('SELECT slug,kind,title,body FROM content_pages WHERE published=1 ORDER BY slug'))[0]));
 app.get('/api/content/:slug',async(r,s)=>{const [rows]=await db().execute('SELECT slug,kind,title,body FROM content_pages WHERE slug=? AND published=1',[r.params.slug]);rows[0]?s.json(rows[0]):s.sendStatus(404)});
 app.get('/api/admin/content',admin,async(_r,s)=>s.json((await db().execute('SELECT * FROM content_pages ORDER BY slug'))[0]));
 app.put('/api/admin/content/:slug',admin,sameOrigin,async(r,s)=>{
  const title=text(r.body.title,160),body=text(r.body.body,30000),kind=r.body.kind||'page';
  if(!/^[a-z0-9-]{1,100}$/.test(r.params.slug)||!title||!body||!['page','policy','campaign','activity','setting'].includes(kind)||typeof r.body.published!=='boolean')return s.sendStatus(400);
  // Plain text only. Authenticated documents and payment coordinates have a separate approval gate.
  if(/(?:bank-account|bank-details|upi|certificate|legal-document)/.test(r.params.slug))return s.status(409).json({error:'This content requires authenticated source review.'});
  const c=await db().getConnection();try{await c.beginTransaction();await c.execute('INSERT INTO content_pages(slug,kind,title,body,published) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),body=VALUES(body),kind=VALUES(kind),published=VALUES(published)',[r.params.slug,kind,title,body,r.body.published]);await c.execute('INSERT INTO audit_events(admin_id,action,resource) VALUES (?,?,?)',[r.admin.id,'content.update',r.params.slug]);await c.commit();s.json({ok:true})}catch(e){await c.rollback();throw e}finally{c.release()}
 });
 app.get('/api/admin/audit',admin,async(_r,s)=>s.json((await db().execute('SELECT id,admin_id,action,resource,created_at FROM audit_events ORDER BY id DESC LIMIT 500'))[0]));
 app.get('/api/programs/:id',async(r,s)=>{if(!/^\d+$/.test(r.params.id))return s.sendStatus(404);const [rows]=await db().execute('SELECT id,title,short_description,description,image_path,location,start_date,end_date,status FROM programs WHERE id=? AND active=1',[r.params.id]);rows[0]?s.json(rows[0]):s.sendStatus(404)});
}
