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
  let connection;
  try{
   connection=await db().getConnection();
   await connection.beginTransaction();
   const result=await change(connection);
   if(result.status<300)await connection.execute('INSERT INTO audit_events(admin_id,action,resource) VALUES (?,?,?)',[req.admin.id,action,'organization']);
   await connection.commit();
   return result.status<300?res.json(result.data):res.status(result.status).json({
    error:result.status===409?'The organization draft or published profile changed. Review the latest version.':result.error
   });
  }catch(error){
   await connection?.rollback().catch(()=>{});
   if(error.code==='ER_LOCK_DEADLOCK'){
    return res.status(409).json({error:'Another organization edit was being saved. Review the latest version.'});
   }
   return res.status(500).json({error:'The server could not persist the organization change. Check the saved draft before retrying.'});
  }finally{connection?.release()}
 }
 app.get(route,admin,async(_req,res)=>{
  res.set('Cache-Control','no-store');
  const [[row]]=await db().execute('SELECT title,body FROM content_drafts WHERE slug=?',[slug]);
  if(!row)return res.sendStatus(404);
  return res.json({revision:row.title,profile:JSON.parse(row.body).profile});
 });
 app.put(route,admin,sameOrigin,async(req,res)=>{
  const profile=validate(req.body?.profile,{complete:false});
  if(!profile)return res.status(400).json({error:'Check field lengths, email addresses, phone numbers and website URLs.'});
  return write(req,res,'organization.draft',async connection=>{
   const [[saved]]=await connection.execute('SELECT title,body FROM content_drafts WHERE slug=? FOR UPDATE',[slug]);
   if((saved?.title??null)!==(req.body.revision??null))return {status:409};
   const revision=randomUUID();
   const baseline=saved?JSON.parse(saved.body).baseline:checksum(await read(connection,' FOR UPDATE'));
   const body=JSON.stringify({profile,baseline});
   if(saved){
    await connection.execute('UPDATE content_drafts SET title=?,body=? WHERE slug=?',[revision,body,slug]);
   }else{
    try{
     await connection.execute("INSERT INTO content_drafts(slug,kind,title,body) VALUES (?,'setting',?,?)",[slug,revision,body]);
    }catch(error){
     if(error.code==='ER_DUP_ENTRY')return {status:409};
     throw error;
    }
   }
   return {status:200,data:{revision,profile}};
  });
 });
 app.post(route+'/publish',admin,sameOrigin,async(req,res)=>write(req,res,'organization.publish',async connection=>{
  const [[saved]]=await connection.execute('SELECT title,body FROM content_drafts WHERE slug=? FOR UPDATE',[slug]);
  if(!saved||saved.title!==req.body?.revision)return {status:409};
  const {profile:storedProfile,baseline}=JSON.parse(saved.body);
  const profile=validate(storedProfile);
  if(!profile)return {status:400,error:'Enter a valid NGO name, primary email and primary phone before publishing.'};
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
