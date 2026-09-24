import express from'express';
import helmet from'helmet';
import cookieParser from'cookie-parser';
import rateLimit from'express-rate-limit';
import bcrypt from'bcryptjs';
import multer from'multer';
import Razorpay from'razorpay';
import fs from'node:fs/promises';
import fsSync from'node:fs';
import path from'node:path';
import crypto from'node:crypto';
import{db}from'./config/db.js';
import{admin,issue}from'./middleware/auth.js';
import{donationPaise,hmac,safeEqual,sha256,validDonor}from'./payments.js';

const paid='paid';
const duplicate=error=>error?.code==='ER_DUP_ENTRY'||error?.code==='23505';

export function createApp(options={}){
  const uploadRoot=path.resolve(options.uploadRoot||path.join(process.cwd(),'uploads'));
  const dirs={gallery:path.join(uploadRoot,'gallery'),members:path.join(uploadRoot,'members')};
  for(const dir of Object.values(dirs))fsSync.mkdirSync(dir,{recursive:true});
  const razorpay=options.razorpay;
  const app=express();
  const cookie={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:8*3600e3};
  const valid=['image/jpeg','image/png','image/webp'];
  const configuredOrigin=options.trustedOrigin??process.env.APP_ORIGIN;
  const sameOrigin=(request,response,next)=>{
    if(!configuredOrigin)return process.env.NODE_ENV==='production'?response.status(403).json({error:'Forbidden'}):next();
    let expected,provided;
    try{expected=new URL(configuredOrigin).origin;provided=new URL(request.get('origin')||request.get('referer')).origin}catch{return response.status(403).json({error:'Forbidden'})}
    return provided===expected?next():response.status(403).json({error:'Forbidden'});
  };
  const upload=kind=>multer({storage:multer.diskStorage({destination:(request,file,done)=>done(null,dirs[kind]),filename:(request,file,done)=>done(null,crypto.randomUUID()+'.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.mimetype])}),limits:{fileSize:5*1024*1024},fileFilter:(request,file,done)=>done(valid.includes(file.mimetype)?null:Error('Invalid image type'),valid.includes(file.mimetype))});
  const publicPath=(file,kind)=>file?`uploads/${kind}/${file.filename}`:null;
  const remove=async(storedPath,kind)=>{
    const root=path.resolve(dirs[kind]);
    const stored=String(storedPath||'').replaceAll('\\','/').replace(/^\/?uploads\/(gallery|members)\//,'');
    const target=path.resolve(root,stored);
    const relative=path.relative(root,target);
    if(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative))await fs.unlink(target).catch(()=>{});
  };
  const fail=(response,status=400)=>response.status(status).json({error:'Unable to process payment'});
  const orderId=value=>typeof value==='string'&&value.trim().length>0&&value.length<=80?value.trim():null;
  const paymentId=value=>typeof value==='string'&&value.trim().length>0&&value.length<=80?value.trim():null;
  const paymentSignature=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value)?value.toLowerCase():null;

  app.use(helmet());
  app.use(cookieParser());
  app.post('/api/webhooks/razorpay',express.raw({type:'application/json',limit:'100kb'}),async(request,response)=>{
    const raw=Buffer.isBuffer(request.body)?request.body:Buffer.alloc(0);
    const signature=request.get('x-razorpay-signature');
    if(!raw.length||!signature||!safeEqual(hmac(process.env.RAZORPAY_WEBHOOK_SECRET,raw),signature))return fail(response);
    let payload;
    try{payload=JSON.parse(raw.toString('utf8'))}catch{return fail(response)}
    const event=payload?.event;
    const providerPayment=payload?.payload?.payment?.entity;
    const localOrder=orderId(providerPayment?.order_id);
    const providerPaymentId=paymentId(providerPayment?.id);
    if(!['payment.captured','payment.failed'].includes(event)||!localOrder||!providerPaymentId)return fail(response);
    const eventId=String(request.get('x-razorpay-event-id')||payload.event_id||sha256(raw));
    try{await db().execute('insert into webhook_events(provider,event_id,event_type,payload_hash) values(?,?,?,?)',['razorpay',eventId,event,sha256(raw)])}catch(error){if(duplicate(error))return response.json({ok:true,duplicate:true});return fail(response,503)}
    const[rows]=await db().execute('select id,status,razorpay_payment_id from donations where razorpay_order_id=?',[localOrder]);
    const donation=rows[0];
    if(!donation)return fail(response,404);
    try{
      if(event==='payment.captured'){
        if(donation.status===paid&&donation.razorpay_payment_id!==providerPaymentId)return fail(response,409);
        if(donation.status!==paid)await db().execute("update donations set razorpay_payment_id=?,status='paid' where id=? and status<>'paid'",[providerPaymentId,donation.id]);
      }else if(donation.status!==paid)await db().execute("update donations set status='failed' where id=? and status<>'paid'",[donation.id]);
      await db().execute('update webhook_events set processed_at=now() where provider=? and event_id=?',['razorpay',eventId]);
      return response.json({ok:true});
    }catch{return fail(response,503)}
  });
  app.use(express.json({limit:'100kb'}));
  app.use('/uploads',express.static(uploadRoot));

  app.post('/api/auth/login',rateLimit({windowMs:60000,max:5}),async(request,response)=>{const[email,password]=[request.body.email,request.body.password];const[admins]=await db().execute('select id,email,password_hash from admins where email=?',[email||'']);const user=admins[0];if(!user||!await bcrypt.compare(password||'',user.password_hash))return response.status(401).json({error:'Invalid credentials'});response.cookie('admin',issue(user.id),cookie).json({id:user.id,email:user.email})});
  app.get('/api/auth/me',admin,(request,response)=>response.json(request.admin));
  app.post('/api/auth/logout',sameOrigin,(request,response)=>{response.clearCookie('admin',cookie);response.sendStatus(204)});
  app.post('/api/contact',rateLimit({windowMs:60000,max:5}),async(request,response)=>{const details=request.body;if(details.website||!details.name?.trim()||!/^\S+@\S+\.\S+$/.test(details.email||'')||!details.subject?.trim()||!details.message?.trim()||!details.turnstile_token)return response.status(400).json({error:'Unable to send message'});try{const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000),body=new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY||'',response:details.turnstile_token}),verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:controller.signal});clearTimeout(timeout);const result=await verification.json();if(!verification.ok||result?.success!==true)throw Error('verification failed')}catch{return response.status(400).json({error:'Unable to send message'})}await db().execute('insert into contact_messages(name,email,mobile,subject,message) values(?,?,?,?,?)',[details.name,details.email,details.mobile||null,details.subject,details.message]);response.sendStatus(201)});

  app.post('/api/donations/create-order',rateLimit({windowMs:60000,max:10}),async(request,response)=>{
    const donor=request.body,amount=donationPaise(donor.amount);
    if(!validDonor(donor)||!amount)return fail(response);
    let order;
    try{order=await (razorpay||new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET})).orders.create({amount,currency:'INR',receipt:crypto.randomUUID()})}catch{return fail(response,502)}
    if(!orderId(order?.id)||order.amount!==amount||order.currency!=='INR')return fail(response,502);
    try{await db().execute('insert into donations(donor_name,donor_email,donor_mobile,amount,currency,razorpay_order_id,status) values(?,?,?,?,?,?,?)',[donor.name.trim(),donor.email.trim(),donor.mobile.trim(),amount,'INR',order.id,'created'])}catch{return fail(response,503)}
    return response.status(201).json({id:order.id,amount,currency:'INR'});
  });
  app.post('/api/donations/verify-payment',rateLimit({windowMs:60000,max:10}),async(request,response)=>{
    const suppliedOrder=orderId(request.body.razorpay_order_id),suppliedPayment=paymentId(request.body.razorpay_payment_id||request.body.payment_id),signature=paymentSignature(request.body.razorpay_signature);
    if(!suppliedOrder||!suppliedPayment||!signature)return fail(response);
    const[orders]=await db().execute('select id,amount,currency,status,razorpay_order_id,razorpay_payment_id from donations where razorpay_order_id=?',[suppliedOrder]);
    const donation=orders[0];
    if(!donation||donation.razorpay_order_id!==suppliedOrder)return fail(response,404);
    if(!safeEqual(hmac(process.env.RAZORPAY_KEY_SECRET,`${suppliedOrder}|${suppliedPayment}`),signature))return fail(response);
    const[payments]=await db().execute('select id from donations where razorpay_payment_id=?',[suppliedPayment]);
    if(payments[0]&&payments[0].id!==donation.id)return fail(response,409);
    if(donation.status===paid)return donation.razorpay_payment_id===suppliedPayment?response.json({ok:true,idempotent:true}):fail(response,409);
    try{await db().execute("update donations set razorpay_payment_id=?,status='paid' where id=? and status<>'paid'",[suppliedPayment,donation.id])}catch(error){return duplicate(error)?fail(response,409):fail(response,503)}
    return response.json({ok:true});
  });

  app.get('/api/gallery',async(request,response)=>response.json((await db().execute('select id,title,description,image_path,event_date,display_order from gallery_items where active=1 order by display_order,id'))[0]));
  app.get('/api/members',async(request,response)=>response.json((await db().execute('select id,name,designation,bio,photo_path,display_order from members where active=1 order by display_order,id'))[0]));
  app.get('/api/admin/gallery',admin,async(request,response)=>response.json((await db().execute('select * from gallery_items order by created_at desc'))[0]));
  app.get('/api/admin/members',admin,async(request,response)=>response.json((await db().execute('select * from members order by display_order,id'))[0]));
  for(const[kind,columns]of [['gallery',['title','description','event_date','display_order','active','image_path']],['members',['name','designation','bio','display_order','active','photo_path']]]){
    const image=kind==='gallery'?'image_path':'photo_path',table=kind==='gallery'?'gallery_items':'members';
    app.post(`/api/admin/${kind}`,admin,sameOrigin,upload(kind).single('image'),async(request,response)=>{if(!request.body[columns[0]])return response.sendStatus(400);const values=columns.map(column=>column===image?publicPath(request.file,kind):(request.body[column]??null));try{const[result]=await db().execute(`insert into ${table} (${columns.join(',')}) values (${columns.map(()=>'?').join(',')})`,values);response.status(201).json({id:result.insertId})}catch(error){await remove(publicPath(request.file,kind),kind);throw error}});
    app.put(`/api/admin/${kind}/:id`,admin,sameOrigin,upload(kind).single('image'),async(request,response)=>{const[records]=await db().execute(`select * from ${table} where id=?`,[request.params.id]);const old=records[0];if(!old){await remove(publicPath(request.file,kind),kind);return response.sendStatus(404)}const values=columns.map(column=>column===image?(publicPath(request.file,kind)||old[image]):(request.body[column]??old[column]));try{await db().execute(`update ${table} set ${columns.map(column=>`${column}=?`).join(',')} where id=?`,[...values,request.params.id]);if(request.file)await remove(old[image],kind);response.json({id:Number(request.params.id)})}catch(error){await remove(publicPath(request.file,kind),kind);throw error}});
    app.delete(`/api/admin/${kind}/:id`,admin,sameOrigin,async(request,response)=>{const[records]=await db().execute(`select * from ${table} where id=?`,[request.params.id]);const old=records[0];if(!old)return response.sendStatus(404);await db().execute(`delete from ${table} where id=?`,[request.params.id]);await remove(old[image],kind);response.sendStatus(204)});
  }
  app.get('/api/admin/contact-messages',admin,async(request,response)=>response.json((await db().execute('select * from contact_messages order by id desc'))[0]));
  app.get('/api/admin/donations',admin,async(request,response)=>response.json((await db().execute('select * from donations order by id desc'))[0]));
  app.use((error,request,response,next)=>response.status(error.code==='LIMIT_FILE_SIZE'?413:400).json({error:'Request failed'}));
  return app;
}
