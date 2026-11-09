import {createHash,randomUUID} from 'node:crypto';

const slug='_organization_profile';
const route='/api/admin/organization/draft';
const checksum=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');

export function organizationDraft(app,{db,admin,sameOrigin,columns,validate}){
 const read=async(connection,lock='')=>{
  const [[row]]=await connection.execute('SELECT '+columns.join(',')+' FROM organization_settings WHERE id=1'+lock);
  return row;
 };
 async function write(req,res,action,change){
  const connection=await db().getConnection();
  try{
   await connection.beginTransaction();
   const result=await change(connection);
   if(result.status<300)await connection.execute('INSERT INTO audit_events(admin_id,action,resource) VALUES (?,?,?)',[req.admin.id,action,'organization']);
   await connection.commit();
   return result.status<300?res.json(result.data):res.sendStatus(result.status);
  }catch(error){
   await connection.rollback();
   throw error;
  }finally{connection.release()}
 }
 app.get(route,admin,async(_req,res)=>{
  res.set('Cache-Control','no-store');
  const [[row]]=await db().execute('SELECT title,body FROM content_drafts WHERE slug=?',[slug]);
  if(!row)return res.sendStatus(404);
  return res.json({revision:row.title,profile:JSON.parse(row.body).profile});
 });
 app.put(route,admin,sameOrigin,async(req,res)=>{
  const profile=validate(req.body?.profile);
  if(!profile)return res.sendStatus(400);
  return write(req,res,'organization.draft',async connection=>{
   const [[saved]]=await connection.execute('SELECT title,body FROM content_drafts WHERE slug=? FOR UPDATE',[slug]);
   if((saved?.title??null)!==(req.body.revision??null))return {status:409};
   const revision=randomUUID();
   const baseline=saved?JSON.parse(saved.body).baseline:checksum(await read(connection,' FOR UPDATE'));
   await connection.execute("INSERT INTO content_drafts(slug,kind,title,body) VALUES (?,'setting',?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),body=VALUES(body)",[slug,revision,JSON.stringify({profile,baseline})]);
   return {status:200,data:{revision,profile}};
  });
 });
 app.post(route+'/publish',admin,sameOrigin,async(req,res)=>write(req,res,'organization.publish',async connection=>{
  const [[saved]]=await connection.execute('SELECT title,body FROM content_drafts WHERE slug=? FOR UPDATE',[slug]);
  if(!saved||saved.title!==req.body?.revision)return {status:409};
  const {profile,baseline}=JSON.parse(saved.body);
  if(checksum(await read(connection,' FOR UPDATE'))!==baseline)return {status:409};
  await connection.execute('INSERT INTO organization_settings(id,'+columns.join(',')+') VALUES (1,'+columns.map(()=>'?').join(',')+') ON DUPLICATE KEY UPDATE '+columns.map(column=>column+'=VALUES('+column+')').join(','),columns.map(column=>profile[column]||null));
  await connection.execute('DELETE FROM content_drafts WHERE slug=?',[slug]);
  return {status:200,data:profile};
 }));
 app.delete(route,admin,sameOrigin,async(req,res)=>write(req,res,'organization.discard',async connection=>{
  const [result]=await connection.execute('DELETE FROM content_drafts WHERE slug=? AND title=?',[slug,typeof req.body?.revision==='string'?req.body.revision:'']);
  return result.affectedRows?{status:200,data:{discarded:true}}:{status:409};
 }));
}
