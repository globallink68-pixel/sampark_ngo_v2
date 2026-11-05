import express from'express';
import {workflows} from './workflows.js';
import {sanitizeImage} from './images.js';
import helmet from'helmet';
import cookieParser from'cookie-parser';
import rateLimit from'express-rate-limit';
import bcrypt from'bcryptjs';
import multer from'multer';

import fs from'node:fs/promises';
import fsSync from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';
import crypto from'node:crypto';
import{db}from'./config/db.js';
import{admin,issue}from'./middleware/auth.js';
import {tokenHash} from './middleware/session.js';
import {routeMetadata,renderMetadata,originUrl,publicRoutes,escapeMarkup,normalizeRoute} from './seo.js';





export function createApp(options={}){
  const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const distRoot=path.resolve(options.distRoot||path.join(projectRoot,'dist'));
  const distIndex=path.join(distRoot,'index.html');
  const hasDist=fsSync.existsSync(distIndex)&&fsSync.statSync(distIndex).isFile();
  const configuredUploadRoot=typeof process.env.UPLOAD_ROOT==='string'&&process.env.UPLOAD_ROOT.trim()?process.env.UPLOAD_ROOT.trim():null;
  const uploadRoot=path.resolve(options.uploadRoot??configuredUploadRoot??path.join(process.cwd(),'uploads'));
  const dirs={gallery:path.join(uploadRoot,'gallery'),members:path.join(uploadRoot,'members'),programs:path.join(uploadRoot,'programs')};
  for(const dir of Object.values(dirs))fsSync.mkdirSync(dir,{recursive:true});

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
  const upload=kind=>({single:field=>[
    multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:30},fileFilter:(_r,file,done)=>done(valid.includes(file.mimetype)?null:Error('Invalid image type'),valid.includes(file.mimetype))}).single(field),
    async(request,_response,next)=>{if(!request.file)return next();try{const buffer=await sanitizeImage(request.file.buffer);request.file.filename=crypto.randomUUID()+'.webp';await fs.writeFile(path.join(dirs[kind],request.file.filename),buffer,{flag:'wx'});next()}catch{next(Error('Invalid image content'))}}
  ]});  const publicPath=(file,kind)=>file?`uploads/${kind}/${file.filename}`:null;
  const remove=async(storedPath,kind)=>{
    const root=path.resolve(dirs[kind]);
    const stored=String(storedPath||'').replaceAll('\\','/').replace(/^\/?uploads\/(gallery|members|programs)\//,'');
    const target=path.resolve(root,stored);
    const relative=path.relative(root,target);
    if(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative))await fs.unlink(target).catch(()=>{});
  };
  const date=value=>value===undefined||value===null||value===''?null:/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`))?value:null;
  const programInput=body=>{
    const title=typeof body.title==='string'?body.title.trim():'';
    const shortDescription=typeof body.short_description==='string'?body.short_description.trim():'';
    const description=typeof body.description==='string'?body.description.trim():'';
    const location=typeof body.location==='string'?body.location.trim():'';
    const status=typeof body.status==='string'?body.status.trim():'';
    const startDate=date(body.start_date),endDate=date(body.end_date);
    const displayOrder=Number(body.display_order??0),active=String(body.active??'1');
    if(!title||title.length>160||shortDescription.length>500||description.length>10000||location.length>255||!['upcoming','ongoing','completed'].includes(status)||body.start_date&&startDate===null||body.end_date&&endDate===null||startDate&&endDate&&startDate>endDate||!Number.isInteger(displayOrder)||displayOrder<-1000000||displayOrder>1000000||!['0','1'].includes(active))return null;
    return{title,shortDescription:shortDescription||null,description:description||null,location:location||null,status,startDate,endDate,displayOrder,active:Number(active)};
  };
  const donationFilters=query=>{
    const clauses=[],params=[];
    if(query.status!==undefined){if(!['created','paid','failed'].includes(query.status))return null;clauses.push('status=?');params.push(query.status)}
    if(query.search!==undefined){const search=String(query.search).trim();if(search.length>120)return null;if(search){clauses.push('(donor_name like ? or donor_email like ? or donor_mobile like ?)');params.push(...Array(3).fill(`%${search}%`))}}
    const from=date(query.from),to=date(query.to);
    if(query.from&&from===null||query.to&&to===null||from&&to&&from>to)return null;
    if(from){clauses.push('created_at>=?');params.push(from)}
    if(to){clauses.push('created_at<date_add(?, interval 1 day)');params.push(to)}
    return{where:clauses.length?` where ${clauses.join(' and ')}`:'',params};
  };
  const organizationColumns=['organization_name','tagline','short_description','address','city','state','postal_code','primary_email','secondary_email','primary_phone','secondary_phone','whatsapp_number','facebook_url','instagram_url','youtube_url','linkedin_url','threads_url','x_url','google_maps_url','website_url'];
  const publicOrganization=record=>Object.fromEntries(organizationColumns.filter(column=>Object.hasOwn(record,column)).map(column=>[column,record[column]]));
  const organizationInput=body=>{
    if(!body||typeof body!=='object'||Array.isArray(body))return null;
    const text=(key,max,required=false)=>{const value=body[key];if(value===undefined||value===null)return required?null:'';if(typeof value!=='string')return null;const normalized=value.trim();return normalized.length<=max&&!/[<>]/.test(normalized)&&(normalized||!required)?normalized:null};
    const email=(key,required=false)=>{const value=text(key,254,required);return value===null||!value&&!required?value:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?value:null};
    const phone=(key,required=false)=>{const value=text(key,30,required);return value===null||!value&&!required?value:/^[0-9+()\-\s]{7,30}$/.test(value)?value:null};
    const url=key=>{const value=text(key,500);if(value===null||!value)return value;try{const parsed=new URL(value);return['http:','https:'].includes(parsed.protocol)?parsed.href:null}catch{return null}};
    const result={organization_name:text('organization_name',160,true),tagline:text('tagline',255),short_description:text('short_description',1000),address:text('address',500),city:text('city',120),state:text('state',120),postal_code:text('postal_code',20),primary_email:email('primary_email',true),secondary_email:email('secondary_email'),primary_phone:phone('primary_phone',true),secondary_phone:phone('secondary_phone'),whatsapp_number:phone('whatsapp_number'),facebook_url:url('facebook_url'),instagram_url:url('instagram_url'),youtube_url:url('youtube_url'),linkedin_url:url('linkedin_url'),threads_url:url('threads_url'),x_url:url('x_url'),google_maps_url:url('google_maps_url'),website_url:url('website_url')};
    return Object.values(result).some(value=>value===null)?null:result;
  };
  const plain=value=>typeof value==='string'&&!/[<>]/.test(value)?value.trim():null;
  const contactInput=body=>{
    if(!body||typeof body!=='object')return null;
    const name=plain(body.name),address=plain(body.address??''),city=plain(body.city??''),state=plain(body.state??''),postalCode=plain(body.postal_code??''),email=plain(body.email),mobile=plain(body.mobile),subject=plain(body.subject),message=plain(body.message);
    if(!name||name.length>120||address===null||address.length>500||city===null||city.length>120||state===null||state.length>120||postalCode===null||postalCode.length>20||!/^\S+@\S+\.\S+$/.test(email||'')||!mobile||mobile.length>30||!/^[0-9+()\-\s]{7,30}$/.test(mobile)||!subject||subject.length>160||!message||message.length>5000||body.consent!==true)return null;
    return{name,address:address||null,city:city||null,state:state||null,postalCode:postalCode||null,email,mobile,subject,message};
  };

  app.use(helmet());
  app.use(cookieParser());
  // Unconditional retirement: configuration cannot re-enable provider mutations.
  app.use((request,response,next)=>{
    if ((request.path.startsWith('/api/donations/') || request.path.startsWith('/api/webhooks/') || request.path.startsWith('/api/subscriptions/') || request.path.startsWith('/api/admin/subscriptions/')) && !['GET','HEAD'].includes(request.method))
      return response.status(410).json({error:'Online payment operations are retired. Contact authorised staff for reconciliation.'});
    next();
  });
  app.use(express.json({limit:'100kb'}));
  app.use('/uploads',express.static(uploadRoot));

  app.post('/api/auth/login',rateLimit({windowMs:60000,max:5}),async(request,response)=>{const[email,password]=[request.body.email,request.body.password];const[admins]=await db().execute('select id,email,password_hash,active,role from admins where email=?',[email||'']);const user=admins[0];if(!user||!user.active||user.role!=='admin'||!await bcrypt.compare(password||'',user.password_hash))return response.status(401).json({error:'Invalid credentials'});const token=issue(user.id);await db().execute('update admins set session_token=?,expires_at=? where id=?',[tokenHash(token),new Date(Date.now()+8*3600e3),user.id]);response.cookie('admin',token,cookie).json({id:user.id,email:user.email})});
  app.get('/api/auth/me',admin,(request,response)=>response.json(request.admin));
  app.post('/api/auth/logout',admin,sameOrigin,async(request,response)=>{await db().execute('update admins set session_token=NULL,expires_at=NULL where id=?',[request.admin.id]);response.clearCookie('admin',cookie);response.sendStatus(204)});
  app.post('/api/contact',rateLimit({windowMs:60000,max:5}),async(request,response)=>{const details=contactInput(request.body);if(!details||request.body.website)return response.status(400).json({error:'Please check the enquiry details and consent.'});await db().execute("insert into contact_messages(name,address,city,state,postal_code,email,mobile,subject,message,status) values(?,?,?,?,?,?,?,?,?,'new')",[details.name,details.address,details.city,details.state,details.postalCode,details.email,details.mobile,details.subject,details.message]);response.sendStatus(201)});

  app.get('/api/gallery',async(request,response)=>response.json((await db().execute('select id,title,description,image_path,event_date,display_order from gallery_items where active=1 order by display_order,id'))[0]));
  app.get('/api/members',async(request,response)=>response.json((await db().execute('select id,name,designation,bio,photo_path,display_order from members where active=1 order by display_order,id'))[0]));
  app.get('/api/programs',async(request,response)=>response.json((await db().execute('select id,title,short_description,description,image_path,location,start_date,end_date,status,display_order from programs where active=1 order by display_order,id'))[0]));
  app.get('/api/organization',async(request,response)=>{const[rows]=await db().execute(`select ${organizationColumns.join(',')} from organization_settings where id=1`);return response.json(rows[0]?publicOrganization(rows[0]):{})});
  app.get('/api/admin/gallery',admin,async(request,response)=>response.json((await db().execute('select * from gallery_items order by created_at desc'))[0]));
  app.get('/api/admin/members',admin,async(request,response)=>response.json((await db().execute('select * from members order by display_order,id'))[0]));
  app.get('/api/admin/programs',admin,async(request,response)=>response.json((await db().execute('select * from programs order by display_order,id'))[0]));
  app.get('/api/admin/organization',admin,async(request,response)=>{const[rows]=await db().execute(`select ${organizationColumns.join(',')} from organization_settings where id=1`);return response.json(rows[0]||{})});
  for(const[kind,columns]of [['gallery',['title','description','event_date','display_order','active','image_path']],['members',['name','designation','bio','display_order','active','photo_path']]]){
    const image=kind==='gallery'?'image_path':'photo_path',table=kind==='gallery'?'gallery_items':'members';
    app.post(`/api/admin/${kind}`,admin,sameOrigin,upload(kind).single('image'),async(request,response)=>{if(!request.body[columns[0]])return response.sendStatus(400);const values=columns.map(column=>column===image?publicPath(request.file,kind):(request.body[column]??null));try{const[result]=await db().execute(`insert into ${table} (${columns.join(',')}) values (${columns.map(()=>'?').join(',')})`,values);response.status(201).json({id:result.insertId})}catch(error){await remove(publicPath(request.file,kind),kind);throw error}});
    app.put(`/api/admin/${kind}/:id`,admin,sameOrigin,upload(kind).single('image'),async(request,response)=>{const[records]=await db().execute(`select * from ${table} where id=?`,[request.params.id]);const old=records[0];if(!old){await remove(publicPath(request.file,kind),kind);return response.sendStatus(404)}const values=columns.map(column=>column===image?(publicPath(request.file,kind)||old[image]):(request.body[column]??old[column]));try{await db().execute(`update ${table} set ${columns.map(column=>`${column}=?`).join(',')} where id=?`,[...values,request.params.id]);if(request.file)await remove(old[image],kind);response.json({id:Number(request.params.id)})}catch(error){await remove(publicPath(request.file,kind),kind);throw error}});
    app.delete(`/api/admin/${kind}/:id`,admin,sameOrigin,async(request,response)=>{const[records]=await db().execute(`select * from ${table} where id=?`,[request.params.id]);const old=records[0];if(!old)return response.sendStatus(404);await db().execute(`delete from ${table} where id=?`,[request.params.id]);await remove(old[image],kind);response.sendStatus(204)});
  }
  app.post('/api/admin/programs',admin,sameOrigin,upload('programs').single('image'),async(request,response)=>{
    const input=programInput(request.body);
    if(!input){await remove(publicPath(request.file,'programs'),'programs');return response.sendStatus(400)}
    const values=[input.title,input.shortDescription,input.description,publicPath(request.file,'programs'),input.location,input.startDate,input.endDate,input.status,input.displayOrder,input.active];
    try{const[result]=await db().execute('insert into programs (title,short_description,description,image_path,location,start_date,end_date,status,display_order,active) values (?,?,?,?,?,?,?,?,?,?)',values);return response.status(201).json({id:result.insertId})}catch(error){await remove(publicPath(request.file,'programs'),'programs');throw error}
  });
  app.put('/api/admin/programs/:id',admin,sameOrigin,upload('programs').single('image'),async(request,response)=>{
    const[records]=await db().execute('select * from programs where id=?',[request.params.id]);
    const old=records[0];
    if(!old){await remove(publicPath(request.file,'programs'),'programs');return response.sendStatus(404)}
    const input=programInput({...old,...request.body});
    if(!input){await remove(publicPath(request.file,'programs'),'programs');return response.sendStatus(400)}
    const image=publicPath(request.file,'programs')||old.image_path;
    try{await db().execute('update programs set title=?,short_description=?,description=?,image_path=?,location=?,start_date=?,end_date=?,status=?,display_order=?,active=? where id=?',[input.title,input.shortDescription,input.description,image,input.location,input.startDate,input.endDate,input.status,input.displayOrder,input.active,request.params.id]);if(request.file)await remove(old.image_path,'programs');return response.json({id:Number(request.params.id)})}catch(error){await remove(publicPath(request.file,'programs'),'programs');throw error}
  });
  app.delete('/api/admin/programs/:id',admin,sameOrigin,async(request,response)=>{
    const[records]=await db().execute('select * from programs where id=?',[request.params.id]);
    const old=records[0];
    if(!old)return response.sendStatus(404);
    await db().execute('delete from programs where id=?',[request.params.id]);
    await remove(old.image_path,'programs');
    return response.sendStatus(204);
  });
  app.put('/api/admin/organization',admin,sameOrigin,async(request,response)=>{const input=organizationInput(request.body);if(!input)return response.sendStatus(400);const values=organizationColumns.map(column=>input[column]||null);await db().execute(`insert into organization_settings (id,${organizationColumns.join(',')}) values (1,${organizationColumns.map(()=>'?').join(',')}) on duplicate key update ${organizationColumns.map(column=>`${column}=values(${column})`).join(',')}`,values);return response.json(input)});
  app.get('/api/admin/contact-messages',admin,async(request,response)=>{const status=request.query.status,search=String(request.query.search||'').trim();if(status!==undefined&&!['new','contacted','follow_up','resolved','closed'].includes(status)||search.length>120)return response.sendStatus(400);const clauses=[],params=[];if(status){clauses.push('status=?');params.push(status)}if(search){clauses.push('(name like ? or email like ? or mobile like ?)');params.push(...Array(3).fill(`%${search}%`))}return response.json((await db().execute(`select * from contact_messages${clauses.length?` where ${clauses.join(' and ')}`:''} order by created_at desc,id desc`,params))[0])});
  app.get('/api/admin/contact-messages/:id/interactions',admin,async(request,response)=>response.json((await db().execute('select id,interaction_type,note,interaction_at,created_at from contact_interactions where contact_message_id=? order by interaction_at desc,id desc',[request.params.id]))[0]));
  app.put('/api/admin/contact-messages/:id',admin,sameOrigin,async(request,response)=>{const status=String(request.body.status||'');const notes=plain(request.body.admin_notes??'');if(!['new','contacted','follow_up','resolved','closed'].includes(status)||notes===null||notes.length>5000)return response.sendStatus(400);await db().execute("update contact_messages set status=?,admin_notes=?,last_contacted_at=case when ? in ('contacted','follow_up') then now() else last_contacted_at end where id=?",[status,notes||null,status,request.params.id]);return response.json({id:Number(request.params.id),status,admin_notes:notes||null})});
  app.post('/api/admin/contact-messages/:id/interactions',admin,sameOrigin,async(request,response)=>{const type=String(request.body.interaction_type||''),note=plain(request.body.note),at=String(request.body.interaction_at||'');if(!['phone','email','whatsapp','meeting','note','other'].includes(type)||!note||note.length>5000||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(at))return response.sendStatus(400);const[result]=await db().execute('insert into contact_interactions(contact_message_id,interaction_type,note,interaction_at) values(?,?,?,?)',[request.params.id,type,note,at]);await db().execute('update contact_messages set last_contacted_at=?,updated_at=updated_at where id=?',[at,request.params.id]);return response.status(201).json({id:result.insertId})});
  app.get('/api/admin/donations',admin,async(request,response)=>{const filters=donationFilters(request.query);if(!filters)return response.sendStatus(400);return response.json((await db().execute(`select id,donor_name,donor_email,donor_mobile,amount,currency,status,razorpay_order_id,razorpay_payment_id,created_at from donations${filters.where} order by created_at desc,id desc`,filters.params))[0])});
  app.get('/api/admin/donations/summary',admin,async(request,response)=>{const filters=donationFilters(request.query);if(!filters)return response.sendStatus(400);const[rows]=await db().execute(`select coalesce(sum(case when status='paid' then amount else 0 end),0) as paid_amount,coalesce(sum(status='paid'),0) as paid_count,coalesce(sum(status='created'),0) as created_count,coalesce(sum(status='failed'),0) as failed_count from donations${filters.where}`,filters.params);return response.json(rows[0]||{paid_amount:0,paid_count:0,created_count:0,failed_count:0})});
  workflows(app,sameOrigin);
  app.get('/api/page-metadata',async(request,response)=>{
    const route=request.query.path;
    if(typeof route!=='string'||route.length>2048||!route.startsWith('/')||route.startsWith('//')||/[\x00-\x20?#]/.test(route))return response.sendStatus(400);
    const metadata=await routeMetadata(route,(...args)=>db().execute(...args));
    return response.json({...metadata,canonical:originUrl(configuredOrigin)?originUrl(configuredOrigin)+normalizeRoute(route):null});
  });
  if(hasDist){
    app.get('/robots.txt',(_request,response)=>response.type('text/plain').send('User-agent: *\nDisallow: /admin\nDisallow: /api/\n'+(originUrl(configuredOrigin)?'Sitemap: '+originUrl(configuredOrigin)+'/sitemap.xml\n':'')));
    app.get('/sitemap.xml',async(_request,response)=>{
      const origin=originUrl(configuredOrigin);if(!origin)return response.sendStatus(503);
      const [programs]=await db().execute('SELECT id FROM programs WHERE active=1 ORDER BY id');
      const [pages]=await db().execute("SELECT slug,kind FROM content_pages WHERE published=1 AND kind IN ('page','campaign','activity') ORDER BY slug");
      const paths=[...Object.keys(publicRoutes).filter(p=>!['/search','/verify-member','/members','/our-work','/sponsors'].includes(p)),...programs.map(p=>'/programs/'+p.id),...pages.map(p=>({page:'/pages/',campaign:'/campaigns/',activity:'/activities/'})[p.kind]+p.slug)];
      if(paths.length>50000)return response.status(503).type('text/plain').send('Sitemap requires an index.');
      return response.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>'+escapeMarkup(origin+p)+'</loc></url>').join('')+'</urlset>');
    });
    app.use(express.static(distRoot,{index:false,dotfiles:'deny'}));
    app.use(async(request,response,next)=>{
      if(!['GET','HEAD'].includes(request.method)||request.path==='/api'||request.path.startsWith('/api/'))return next();
      const metadata=await routeMetadata(request.path,(...args)=>db().execute(...args));
      const canonicalPath=normalizeRoute(request.path);
      if(metadata.status===200&&canonicalPath!==request.path&&!canonicalPath.startsWith('//'))return response.redirect(308,canonicalPath+(request.originalUrl.includes('?')?request.originalUrl.slice(request.originalUrl.indexOf('?')):''));
      if(metadata.noindex)response.set('X-Robots-Tag','noindex, nofollow');
      const html=renderMetadata(await fs.readFile(distIndex,'utf8'),metadata,request.path,originUrl(configuredOrigin));
      return response.status(metadata.status).type('html').send(html);
    });
  }
  app.use((error,request,response,next)=>response.status(error.code==='LIMIT_FILE_SIZE'?413:400).json({error:'Request failed'}));
  return app;
}
