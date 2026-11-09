import {createHash,randomUUID} from 'node:crypto';
import multer from 'multer';
import {sanitizeImage} from './images.js';

const collections={
 members:{table:'members',photo:'photo_path',required:['name','designation'],text:{name:120,designation:80,bio:2000,category:80}},
 programs:{table:'programs',photo:'image_path',required:['title'],text:{title:160,short_description:500,description:10000,location:255,category:80},dates:['start_date','end_date']},
 gallery:{table:'gallery_items',photo:'image_path',required:['title'],text:{title:160,description:10000,album:80},dates:['event_date']},
 certificates:{table:'verified_certificates',photo:'image_path',required:['title'],text:{title:160,description:4000},verified:true},
 donations:{table:'manual_donations',photo:'image_path',required:['title'],text:{title:160,bank_name:120,account_holder:160,account_number:34,ifsc:11,upi_id:120,description:4000},verified:true}
};
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const route='/api/admin/record-drafts/:collection';
const upload=multer({
 storage:multer.memoryStorage(),
 limits:{files:1,fileSize:5*1024*1024,fields:1,fieldSize:65536,parts:3}
}).single('image');
const fingerprint=row=>createHash('sha256').update(JSON.stringify(row)).digest('hex');
const storedImage=value=>typeof value==='string'&&value.startsWith('api/site-images/')&&uuid.test(value.slice(16))?value.slice(16):null;
const readRecord=async(connection,spec,id,lock='')=>{
 const [[row]]=await connection.execute('SELECT * FROM '+spec.table+' WHERE id=?'+lock,[id]);
 return row;
};

function parsePayload(raw,spec){
 let input;
 try{input=JSON.parse(raw)}catch{return null}
 if(!input||typeof input!=='object')return null;
 const result={};
 for(const [field,limit] of Object.entries(spec.text)){
  const value=input[field]??'';
  if(typeof value!=='string'||value.length>limit||(spec.required.includes(field)&&!value.trim()))return null;
  result[field]=value.trim()||null;
 }
 for(const field of spec.dates??[]){
  const value=input[field]||null;
  if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))return null;
  result[field]=value;
 }
 if(spec.table==='programs'){
  if(!['upcoming','ongoing','completed'].includes(input.status)||result.start_date&&result.end_date&&result.start_date>result.end_date)return null;
  result.status=input.status;
 }
 if(spec.verified){
  if(typeof input.verified!=='boolean'||input.public_visible&&!input.verified)return null;
  result.verified=input.verified;
 }
 if(spec.table==='manual_donations'){
  const bank=[result.bank_name,result.account_holder,result.account_number,result.ifsc];
  if(bank.some(Boolean)&&(!bank.every(Boolean)||!/^\d{6,34}$/.test(result.account_number)||!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(result.ifsc)))return null;
  if(result.upi_id&&!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(result.upi_id))return null;
 }
 if(!Number.isInteger(input.display_order)||Math.abs(input.display_order)>1000000||typeof input.active!=='boolean'||typeof input.public_visible!=='boolean')return null;
 return {...result,display_order:input.display_order,active:input.active,public_visible:input.public_visible};
}

async function transaction(db,work){
 const connection=await db().getConnection();
 try{
  await connection.beginTransaction();
  const result=await work(connection);
  await connection.commit();
  return result;
 }catch(error){
  await connection.rollback();
  throw error;
 }finally{connection.release()}
}

const audit=(connection,admin,action,resource)=>connection.execute('INSERT INTO audit_events(admin_id,action,resource) VALUES (?,?,?)',[admin.id,action,resource]);

export function recordDrafts(app,db,admin,sameOrigin){
 const collection=(req,res,next)=>{
  if(!Object.hasOwn(collections,req.params.collection))return res.sendStatus(404);
  req.recordSpec=collections[req.params.collection];
  res.set('Cache-Control','no-store');
  next();
 };
 const draftId=(req,res,next)=>uuid.test(req.params.id)?next():res.sendStatus(404);
 for(const [kind,columns] of [
  ['certificates','id,title,description,image_path'],
  ['donations','id,title,description,bank_name,account_holder,account_number,ifsc,upi_id,image_path']
 ]){
  const spec=collections[kind];
  app.get(route+'/current/list',admin,collection,async(req,res,next)=>{
   if(req.params.collection!==kind)return next();
   const [rows]=await db().execute('SELECT * FROM '+spec.table+' ORDER BY display_order,id');
   return res.json(rows);
  });
  app.get('/api/verified-'+kind,async(_req,res)=>{
   const [rows]=await db().execute('SELECT '+columns+' FROM '+spec.table+' WHERE active=1 AND public_visible=1 AND verified=1 ORDER BY display_order,id');
   return res.set('Cache-Control','no-store').json(rows.map(row=>({...row,image_path:row.image_path?'/api/verified-'+kind+'/'+row.id+'/image':null})));
  });
  app.get('/api/verified-'+kind+'/:target/image',async(req,res)=>{
   res.set('Cache-Control','no-store');
   if(!/^[1-9]\d{0,19}$/.test(req.params.target))return res.sendStatus(404);
   const [[row]]=await db().execute('SELECT site_images.image FROM '+spec.table+' AS entry JOIN site_images ON entry.image_path=CONCAT(?,site_images.id) WHERE entry.id=? AND entry.active=1 AND entry.public_visible=1 AND entry.verified=1',['api/site-images/',req.params.target]);
   return row?res.type('image/webp').send(row.image):res.sendStatus(404);
  });
 }
 app.get(route,admin,collection,async(req,res)=>{
  const [rows]=await db().execute('SELECT id,target_id,revision,payload,image IS NOT NULL AS has_image FROM record_drafts WHERE collection=? ORDER BY updated_at DESC,id',[req.params.collection]);
  res.json(rows.map(({payload,...row})=>({...row,record:JSON.parse(payload)})));
 });
 app.get(route+'/:id/image',admin,collection,draftId,async(req,res)=>{
  const [[row]]=await db().execute('SELECT image FROM record_drafts WHERE collection=? AND id=? AND (? IS NULL OR revision=?)',[req.params.collection,req.params.id,typeof req.query.revision==='string'?req.query.revision:null,typeof req.query.revision==='string'?req.query.revision:null]);
  return row?.image?res.type('image/webp').send(row.image):res.sendStatus(404);
 });
 app.get(route+'/current/:target/image',admin,collection,async(req,res)=>{
  if(!/^[1-9]\d{0,19}$/.test(req.params.target))return res.sendStatus(404);
  const record=await readRecord(db(),req.recordSpec,req.params.target);
  const id=storedImage(record?.[req.recordSpec.photo]);
  if(!id)return res.sendStatus(404);
  const [[row]]=await db().execute('SELECT image FROM site_images WHERE id=?',[id]);
  return row?res.type('image/webp').send(row.image):res.sendStatus(404);
 });
 async function save(req,res){
  const {collection:kind,id}=req.params;
  const spec=req.recordSpec;
  const record=parsePayload(req.body?.record,spec);
  if(!record)return res.sendStatus(400);
  const target=req.query.target;
  if(target!==undefined&&(typeof target!=='string'||!/^[1-9]\d{0,19}$/.test(target)))return res.sendStatus(400);
  let image=null;
  if(req.file){
   try{image=await sanitizeImage(req.file.buffer)}catch{return res.sendStatus(400)}
   if(image.length>1024*1024)return res.sendStatus(413);
  }
  const key=id??randomUUID(),revision=randomUUID(),payload=JSON.stringify(record);
  const status=await transaction(db,async connection=>{
   if(id){
    const [result]=await connection.execute('UPDATE record_drafts SET revision=?,payload=?,image=COALESCE(?,image) WHERE id=? AND collection=? AND revision=?',[revision,payload,image,id,kind,typeof req.query.revision==='string'?req.query.revision:'']);
    if(!result.affectedRows)return 409;
   }else{
    const live=target?await readRecord(connection,spec,target):null;
    if(target&&!live)return 404;
    await connection.execute('INSERT INTO record_drafts(id,collection,target_id,baseline,revision,payload,image) VALUES (?,?,?,?,?,?,?)',[key,kind,target??null,live?fingerprint(live):null,revision,payload,image]);
   }
   await audit(connection,req.admin,'record.draft',kind+'/'+key);
   return id?200:201;
  });
  return status<300?res.status(status).json({id:key,revision}):res.sendStatus(status);
 }
 app.post(route,admin,sameOrigin,collection,upload,save);
 app.put(route+'/:id',admin,sameOrigin,collection,draftId,upload,save);
 app.delete(route+'/:id',admin,sameOrigin,collection,draftId,async(req,res)=>{
  const status=await transaction(db,async connection=>{
   const [result]=await connection.execute('DELETE FROM record_drafts WHERE id=? AND collection=? AND revision=?',[req.params.id,req.params.collection,typeof req.query.revision==='string'?req.query.revision:'']);
   if(!result.affectedRows)return 409;
   await audit(connection,req.admin,'record.discard',req.params.collection+'/'+req.params.id);
   return 204;
  });
  res.sendStatus(status);
 });
 app.post(route+'/:id/publish',admin,sameOrigin,collection,draftId,async(req,res)=>{
  const spec=req.recordSpec,{collection:kind,id}=req.params;
  const result=await transaction(db,async connection=>{
   const [[draft]]=await connection.execute('SELECT * FROM record_drafts WHERE id=? AND collection=? FOR UPDATE',[id,kind]);
   if(!draft)return {status:404};
   if(draft.revision!==req.body?.revision)return {status:409};
   const current=draft.target_id?await readRecord(connection,spec,draft.target_id,' FOR UPDATE'):null;
   if(draft.target_id&&(!current||fingerprint(current)!==draft.baseline))return {status:409};
   const fields=JSON.parse(draft.payload);
   const visible=fields.active&&fields.public_visible;
   let photo=current?.[spec.photo]??null;
   if((kind==='gallery'||kind==='certificates')&&!photo&&!draft.image)return {status:422};
   if(kind==='donations'&&visible&&!fields.account_number&&!fields.upi_id&&!photo&&!draft.image)return {status:422};
   if(draft.image){
    const imageId=randomUUID();
    await connection.execute('INSERT INTO site_images(id,image,published) VALUES (?,?,?)',[imageId,draft.image,visible&&!spec.verified]);
    photo='api/site-images/'+imageId;
   }else if(visible&&!spec.verified&&storedImage(photo)){
    await connection.execute('UPDATE site_images SET published=1 WHERE id=?',[storedImage(photo)]);
   }
   fields[spec.photo]=photo;
   const keys=Object.keys(fields),values=Object.values(fields);
   let recordId=draft.target_id;
   if(current){
    await connection.execute('UPDATE '+spec.table+' SET '+keys.map(key=>key+'=?').join(',')+' WHERE id=?',[...values,recordId]);
   }else{
    const [insert]=await connection.execute('INSERT INTO '+spec.table+' ('+keys.join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')',values);
    recordId=insert.insertId;
   }
   await connection.execute('DELETE FROM record_drafts WHERE id=?',[id]);
   await audit(connection,req.admin,'record.publish',kind+'/'+recordId);
   return {status:200,id:recordId};
  });
  return result.status===200?res.json({id:result.id}):res.sendStatus(result.status);
 });
}
