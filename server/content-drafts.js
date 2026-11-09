const route='/api/admin/content/:slug/draft';
const validSlug=slug=>/^[a-z0-9-]{1,100}$/.test(slug)&&!/(?:bank-account|bank-details|upi|certificate|legal-document)/.test(slug);
const kinds=['page','policy','campaign','activity','setting'];

function draftInput(value){
 if(!value||typeof value.title!=='string'||typeof value.body!=='string'||!kinds.includes(value.kind))return null;
 const title=value.title.trim(),body=value.body.trim();
 if(!title||title.length>160||!body||body.length>30000||Buffer.byteLength(body)>65535)return null;
 return {title,body,kind:value.kind};
}

async function transaction(db,write){
 const connection=await db().getConnection();
 try{
  await connection.beginTransaction();
  const status=await write(connection);
  await connection.commit();
  return status;
 }catch(error){
  await connection.rollback();
  throw error;
 }finally{
  connection.release();
 }
}

export function contentDrafts(app,db,admin,sameOrigin){
 app.get(route,admin,async(req,res)=>{
  res.set('Cache-Control','no-store');
  if(!validSlug(req.params.slug))return res.sendStatus(400);
  const [rows]=await db().execute('SELECT title,body,kind FROM content_drafts WHERE slug=?',[req.params.slug]);
  return rows[0]?res.json(rows[0]):res.sendStatus(404);
 });

 app.put(route,admin,sameOrigin,async(req,res)=>{
  const slug=req.params.slug,draft=draftInput(req.body);
  if(!validSlug(slug)||!draft)return res.sendStatus(400);
  const status=await transaction(db,async connection=>{
   await connection.execute('INSERT INTO content_drafts(slug,kind,title,body) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE kind=VALUES(kind),title=VALUES(title),body=VALUES(body)',[slug,draft.kind,draft.title,draft.body]);
   await connection.execute('INSERT INTO audit_events(admin_id,action,resource) VALUES (?,?,?)',[req.admin.id,'content.draft',slug]);
   return 204;
  });
  return res.sendStatus(status);
 });

 app.post(route+'/publish',admin,sameOrigin,async(req,res)=>{
  const slug=req.params.slug,reviewed=draftInput(req.body);
  if(!validSlug(slug)||!reviewed)return res.sendStatus(400);
  const status=await transaction(db,async connection=>{
   const [rows]=await connection.execute('SELECT title,body,kind FROM content_drafts WHERE slug=? FOR UPDATE',[slug]);
   const draft=rows[0];
   if(!draft)return 404;
   if(draft.title!==reviewed.title||draft.body!==reviewed.body||draft.kind!==reviewed.kind)return 409;
   await connection.execute('INSERT INTO content_pages(slug,kind,title,body,published) VALUES (?,?,?,?,1) ON DUPLICATE KEY UPDATE kind=VALUES(kind),title=VALUES(title),body=VALUES(body),published=1',[slug,draft.kind,draft.title,draft.body]);
   await connection.execute('DELETE FROM content_drafts WHERE slug=?',[slug]);
   await connection.execute('INSERT INTO audit_events(admin_id,action,resource) VALUES (?,?,?)',[req.admin.id,'content.publish',slug]);
   return 204;
  });
  return res.sendStatus(status);
 });
}
