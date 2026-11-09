import {randomUUID} from 'node:crypto';
import multer from 'multer';
import {sanitizeImage} from './images.js';

const slots=['logo','favicon','hero'];
const imageId=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const route='/api/admin/site-images/:slot';
const upload=multer({
 storage:multer.memoryStorage(),
 limits:{files:1,fileSize:5*1024*1024,fields:0,parts:2}
}).single('image');

async function mutate(db,slot,adminId,action,write){
 const connection=await db().getConnection();
 try{
  await connection.beginTransaction();
  const [[current]]=await connection.execute('SELECT draft_id FROM site_image_slots WHERE slot=? FOR UPDATE',[slot]);
  const result=await write(connection,current);
  if(result===204){
   await connection.execute('INSERT INTO audit_events(admin_id,action,resource) VALUES (?,?,?)',[adminId,action,slot]);
  }
  await connection.commit();
  return result;
 }catch(error){
  await connection.rollback();
  throw error;
 }finally{
  connection.release();
 }
}

export function siteImages(app,db,admin,sameOrigin){
 const validateSlot=(req,res,next)=>slots.includes(req.params.slot)?next():res.sendStatus(404);
 app.get('/api/site-images',async(_req,res)=>{
  const [rows]=await db().execute('SELECT slot,public_id FROM site_image_slots WHERE public_id IS NOT NULL');
  res.set('Cache-Control','no-store').json(Object.fromEntries(rows.map(row=>[row.slot,'/api/site-images/'+row.public_id])));
 });
 app.get('/api/site-images/:id',async(req,res)=>{
  if(!imageId.test(req.params.id))return res.sendStatus(404);
  const [[row]]=await db().execute('SELECT image FROM site_images WHERE id=? AND published=1',[req.params.id]);
  if(!row)return res.set('Cache-Control','no-store').sendStatus(404);
  return res.set('Cache-Control','public, max-age=31536000, immutable').type('image/webp').send(row.image);
 });
 app.get(route,admin,validateSlot,async(req,res)=>{
  const [[row]]=await db().execute('SELECT draft_id,public_id FROM site_image_slots WHERE slot=?',[req.params.slot]);
  res.set('Cache-Control','no-store').json(row);
 });
 app.get(route+'/preview/:id',admin,validateSlot,async(req,res)=>{
  res.set('Cache-Control','no-store');
  if(!imageId.test(req.params.id))return res.sendStatus(404);
  const [[row]]=await db().execute('SELECT image FROM site_images JOIN site_image_slots ON site_images.id=site_image_slots.draft_id WHERE slot=? AND site_images.id=?',[req.params.slot,req.params.id]);
  return row?res.type('image/webp').send(row.image):res.sendStatus(404);
 });
 app.put(route,admin,sameOrigin,validateSlot,upload,async(req,res)=>{
  if(!req.file)return res.sendStatus(400);
  let image;
  try{image=await sanitizeImage(req.file.buffer)}catch{return res.sendStatus(400)}
  if(image.length>1024*1024)return res.sendStatus(413);
  const id=randomUUID();
  const status=await mutate(db,req.params.slot,req.admin.id,'site-image.draft',async(connection,current)=>{
   await connection.execute('INSERT INTO site_images(id,image) VALUES (?,?)',[id,image]);
   await connection.execute('UPDATE site_image_slots SET draft_id=? WHERE slot=?',[id,req.params.slot]);
   if(current.draft_id)await connection.execute('DELETE FROM site_images WHERE id=? AND published=0',[current.draft_id]);
   return 204;
  });
  return res.sendStatus(status);
 });
 app.post(route+'/publish',admin,sameOrigin,validateSlot,async(req,res)=>{
  const id=req.body?.id;
  if(typeof id!=='string'||!imageId.test(id))return res.sendStatus(400);
  const status=await mutate(db,req.params.slot,req.admin.id,'site-image.publish',async(connection,current)=>{
   if(current.draft_id!==id)return 409;
   await connection.execute('UPDATE site_images SET published=1 WHERE id=?',[id]);
   await connection.execute('UPDATE site_image_slots SET public_id=?,draft_id=NULL WHERE slot=?',[id,req.params.slot]);
   return 204;
  });
  return res.sendStatus(status);
 });
}
