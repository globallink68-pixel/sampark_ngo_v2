import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import http from 'node:http';

const fixture=JSON.parse(await fs.readFile('.qa/runtime.json','utf8'));
assert.match(fixture.database,/^sampark_verify_\d+$/);
Object.assign(process.env,{NODE_ENV:'test',DB_HOST:'127.0.0.1',DB_PORT:'33379',DB_NAME:fixture.database,DB_USER:'root',DB_PASSWORD:'synthetic-local-only',SESSION_SECRET:'synthetic-browser-only-key'});
const server=http.createServer();
server.listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const {createApp}=await import('../server/app.js');
const {db}=await import('../server/config/db.js');
const {publicRoutes}=await import('../server/seo.js');
server.on('request',createApp({uploadRoot:fixture.uploadRoot,trustedOrigin:origin}));
let browser;
const results=[];
try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const admin=await browser.newPage(),visitor=await browser.newPage();
 const errors=[];
 visitor.on('pageerror',error=>errors.push(error.message));
 await admin.goto(origin+'/admin/login');
 await admin.locator('input[type=email]').fill('admin@example.test');
 await admin.locator('input[type=password]').fill('Synthetic-only-passphrase-2026');
 await admin.locator('form button').last().click();
 await admin.waitForURL('**/admin');
 await admin.goto(origin+'/admin/organization');
 const profile='Browser staged organization '+Date.now();
 await admin.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(button=>button.textContent.trim()==='Save Draft')?.disabled);
 await admin.locator('[name=organization_name]').fill(profile);
 await admin.getByRole('button',{name:'Save Draft',exact:true}).click();
 await admin.getByRole('button',{name:'Preview saved profile'}).waitFor();
 assert.notEqual((await visitor.request.get(origin+'/api/organization').then(r=>r.json())).organization_name,profile);
 assert.equal((await visitor.request.get(origin+'/api/admin/organization/draft')).status(),401);
 await admin.getByRole('button',{name:'Preview saved profile'}).click();
 await admin.getByRole('article',{name:'Private organization preview'}).getByText(profile,{exact:true}).waitFor();
 await admin.getByRole('button',{name:'Publish reviewed profile'}).click();
 await admin.getByRole('button',{name:'Publish reviewed profile'}).waitFor({state:'detached'});
 await visitor.goto(origin);
 await visitor.locator('.navbar-brand').getByText(profile,{exact:false}).waitFor();
 const [[saved]]=await db().execute('SELECT organization_name FROM organization_settings WHERE id=1');
 assert.equal(saved.organization_name,profile);
 console.log('Organization draft, preview, privacy, publication, and persistence PASS');

 await admin.goto(origin+'/admin/gallery');
 await admin.getByText('Upload a batch of gallery drafts',{exact:true}).click();
 const png=await sharp({create:{width:48,height:36,channels:3,background:'#2b5943'}}).png().toBuffer();
 const prefix='Browser gallery '+Date.now();
 await admin.getByLabel('Gallery images').setInputFiles([
  {name:prefix+' one.png',mimeType:'image/png',buffer:png},
  {name:prefix+' two.png',mimeType:'image/png',buffer:png},
  {name:'forged.png',mimeType:'image/png',buffer:Buffer.from('<svg/>')}
 ]);
 await admin.getByLabel('Batch album').fill('Browser album');
 await admin.getByRole('button',{name:'Save or retry gallery drafts'}).click();
 await admin.getByText('Failed. Choose a valid image in a new batch.').waitFor();
 await admin.getByRole('button',{name:prefix+' one',exact:true}).click();
 await admin.getByRole('button',{name:'Preview saved draft'}).click();
 const preview=admin.getByRole('img',{name:'Draft image preview'});
 const draftUrl=await preview.getAttribute('src');
 assert.equal((await visitor.request.get(origin+draftUrl)).status(),401);
 await admin.getByLabel('Public visibility').check();
 await admin.getByRole('button',{name:'Save private draft'}).click();
 await admin.getByText('Private draft saved.',{exact:true}).waitFor();
 await admin.getByRole('button',{name:'Preview saved draft'}).click();
 await admin.getByRole('button',{name:'Publish reviewed draft'}).click();
 await admin.getByText('Reviewed draft published.',{exact:true}).waitFor();
 await visitor.goto(origin+'/gallery');
 await visitor.getByLabel('Album').selectOption('Browser album');
 await visitor.getByRole('button',{name:new RegExp(prefix+' one')}).waitFor();
 assert.equal(await visitor.getByRole('button',{name:new RegExp(prefix+' two')}).count(),0);
 console.log('Gallery batch partial failure, album, draft privacy and individual publication PASS');

 const route='/api/admin/content/site-settings/draft';
 const settings={title:'Browser site settings',kind:'setting',body:JSON.stringify({
  navigation:[{to:'/contact',label:'Reach us'}],footer:'Approved browser footer',
  home:['hero','programmes','faq'],featuredProgrammes:[fixture.programme],
  programmeDescription:'Browser programme introduction',faq:[{question:'Browser FAQ',answer:'Browser answer'}],
  metadata:{'/about':{title:'Browser about SEO',description:'Browser sharing description',image:'/community.webp'}}
 })};
 const headers={Origin:origin};
 assert.equal((await admin.request.put(origin+route,{data:settings,headers})).status(),204);
 assert.equal((await admin.request.post(origin+route+'/publish',{data:settings,headers})).status(),204);
 const markup=await visitor.request.get(origin+'/about').then(r=>r.text());
 assert.ok(markup.includes('Browser about SEO | Sampark Skill Academy'));
 assert.ok(markup.includes('property="og:image" content="'+origin+'/community.webp"'));
 await visitor.goto(origin);
 await visitor.getByRole('heading',{name:'Featured programmes'}).waitFor();
 await visitor.getByText('Browser programme introduction',{exact:true}).waitFor();
 await visitor.getByText('Approved browser footer',{exact:true}).waitFor();
 await visitor.getByText('Browser FAQ',{exact:true}).click();
 await visitor.getByText('Browser answer',{exact:true}).waitFor();
 console.log('Homepage settings, FAQ, footer and server-rendered metadata PASS');

 const routes=[...Object.keys(publicRoutes),'/programs/'+fixture.programme,'/activities/synthetic-activity'];
 const screenshots=new Set(['/','/about','/programs','/programs/'+fixture.programme,'/team','/gallery','/contact','/donate','/transparency','/join-us','/policies/privacy']);
 await fs.mkdir('.qa/final-redesign-browser',{recursive:true});
 for(const width of [1440,1280,768,390,360]){
  await visitor.setViewportSize({width,height:900});
  for(const route of routes){
   const response=await visitor.goto(origin+route,{waitUntil:'networkidle'});
   const metrics=await visitor.evaluate(()=>({headings:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.images].filter(image=>image.complete&&!image.naturalWidth).map(image=>image.src)}));
   const entry={route,width,status:response.status(),...metrics};
   results.push(entry);
   if(screenshots.has(route))await visitor.screenshot({path:'.qa/final-redesign-browser/'+(route.slice(1).replaceAll('/','-')||'home')+'-'+width+'.png',fullPage:true});
  }
 }
 await visitor.setViewportSize({width:390,height:900});
 await visitor.goto(origin,{waitUntil:'networkidle'});
 const performance=await visitor.evaluate(()=>{
  const navigation=window.performance.getEntriesByType('navigation')[0];
  const resources=window.performance.getEntriesByType('resource');
  return {domContentLoadedMs:Math.round(navigation.domContentLoadedEventEnd),loadMs:Math.round(navigation.loadEventEnd),
   scriptTransferBytes:resources.filter(resource=>resource.initiatorType==='script').reduce((total,resource)=>total+resource.transferSize,0)};
 });
 console.log('Local mobile navigation sample '+JSON.stringify(performance));
 const failures=results.filter(row=>row.status!==200||row.headings!==1||row.overflow||row.broken.length);
 await fs.writeFile('.qa/final-redesign-browser/results.json',JSON.stringify({results,failures,errors,performance},null,2));
 assert.deepEqual(failures,[]);
 assert.deepEqual(errors,[]);
 console.log(results.length+' final route and viewport checks PASS');
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
 await db().end();
}
