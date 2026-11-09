import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const fixture=JSON.parse(await fs.readFile('.qa/runtime.json','utf8'));
assert.match(fixture.database,/^sampark_verify_\d+$/);
Object.assign(process.env,{
 NODE_ENV:'test',DB_HOST:'127.0.0.1',DB_PORT:'33379',DB_NAME:fixture.database,
 DB_USER:'root',DB_PASSWORD:'synthetic-local-only',SESSION_SECRET:'synthetic-browser-only-test-key'
});
const {createApp}=await import('../server/app.js');
const {db}=await import('../server/config/db.js');
const app=createApp({uploadRoot:fixture.uploadRoot});
const server=app.listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const admin=await browser.newPage();
 const visitor=await browser.newPage();
 await admin.goto(origin+'/admin/login');
 await admin.locator('input[type=email]').fill('admin@example.test');
 await admin.locator('input[type=password]').fill('Synthetic-only-passphrase-2026');
 await admin.locator('form button').last().click();
 await admin.waitForURL('**/admin');
 await admin.goto(origin+'/admin/content');
 const png=await sharp({create:{width:40,height:30,channels:3,background:'#496241'}}).png().toBuffer();
 const slots=[['logo','NGO logo','.navbar-brand img','src'],['hero','Homepage hero photograph','.hero-visual img','src'],['favicon','Browser icon','link[rel=icon]','href']];
 for(const [slot,label,selector,attribute] of slots){
  const section=admin.locator('section.admin-card').filter({has:admin.getByRole('heading',{name:label,exact:true})});
  await section.getByLabel(label+' file').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:png});
  await section.getByRole('button',{name:'Save image draft'}).click();
  const preview=section.getByRole('img',{name:label+' draft preview'});
  await preview.waitFor();
  const privatePath=await preview.getAttribute('src');
  const id=privatePath.split('/').at(-1);
  const publicPath='/api/site-images/'+id;
  assert.equal((await visitor.request.get(origin+privatePath)).status(),401);
  assert.equal((await visitor.request.get(origin+publicPath)).status(),404);
  assert.notEqual((await visitor.request.get(origin+'/api/site-images').then(response=>response.json()))[slot],publicPath);
  await section.getByRole('button',{name:'Publish previewed image'}).click();
  await section.getByRole('status').filter({hasText:'Image published.'}).waitFor();
  await visitor.goto(origin);
  await visitor.waitForFunction(({selector,attribute,publicPath})=>document.querySelector(selector)?.getAttribute(attribute)===publicPath,{selector,attribute,publicPath});
  await visitor.reload();
  await visitor.waitForFunction(({selector,attribute,publicPath})=>document.querySelector(selector)?.getAttribute(attribute)===publicPath,{selector,attribute,publicPath});
  console.log(slot+': draft privacy, preview, publish and public reload PASS');
 }
 if(process.env.SAMPARK_COMBINED_CMS==='1'){
  const member='Browser acceptance member '+Date.now();
  const description='Browser acceptance NGO description '+Date.now();
  await admin.goto(origin+'/admin/members');
  await admin.getByRole('button',{name:'New draft'}).click();
  await admin.getByLabel('Name',{exact:true}).fill(member);
  await admin.getByLabel('Designation').fill('Trainer');
  await admin.getByLabel('Biography').fill('Approved browser test biography.');
  await admin.getByLabel('Category').fill('Staff');
  await admin.getByLabel('Public visibility').check();
  await admin.getByLabel('Image',{exact:true}).setInputFiles({name:'member.png',mimeType:'image/png',buffer:png});
  await admin.getByRole('button',{name:'Save private draft'}).click();
  await admin.getByRole('status').filter({hasText:'Private draft saved.'}).waitFor();
  await visitor.goto(origin+'/team');
  assert.equal(await visitor.getByRole('heading',{name:member}).count(),0);
  await admin.getByRole('button',{name:'Preview saved draft'}).click();
  const image=admin.getByRole('img',{name:'Draft image preview'});
  await image.waitFor();
  const path=await image.getAttribute('src');
  assert.equal((await visitor.request.get(origin+path)).status(),401);
  assert.equal((await admin.request.get(origin+path)).status(),200);
  await admin.getByRole('button',{name:'Publish reviewed draft'}).click();
  await admin.getByRole('status').filter({hasText:'Reviewed draft published.'}).waitFor();
  await visitor.reload();
  const card=visitor.locator('article').filter({has:visitor.getByRole('heading',{name:member})});
  await card.getByText('Approved browser test biography.').waitFor();
  await card.locator('img').evaluate(img=>img.decode());
  const [[memberRow]]=await db().execute('SELECT category,public_visible FROM members WHERE name=?',[member]);
  assert.equal(memberRow.category,'Staff');
  assert.equal(memberRow.public_visible,1);

  await admin.goto(origin+'/admin/content');
  await admin.getByLabel('Slug',{exact:true}).fill('about');
  await admin.getByLabel('Title',{exact:true}).fill('About Sampark');
  await admin.locator('form select').selectOption('setting');
  await admin.getByLabel('Body',{exact:true}).fill(description);
  await admin.getByRole('button',{name:'Save draft',exact:true}).click();
  await admin.getByRole('status').filter({hasText:'Draft saved.'}).waitFor();
  await visitor.goto(origin+'/about');
  assert.equal(await visitor.getByText(description,{exact:true}).count(),0);
  assert.equal((await visitor.request.get(origin+'/api/admin/content/about/draft')).status(),401);
  await admin.getByRole('button',{name:'Load saved preview'}).click();
  await admin.getByRole('article',{name:'Private draft preview'}).getByText(description,{exact:true}).waitFor();
  await admin.getByRole('button',{name:'Publish previewed draft'}).click();
  await admin.getByRole('status').filter({hasText:'Draft published.'}).waitFor();
  await visitor.reload();
  await visitor.getByText(description,{exact:true}).waitFor();
  const [[about]]=await db().execute('SELECT body,published FROM content_pages WHERE slug=?',['about']);
  assert.deepEqual({...about},{body:description,published:1});
  const [events]=await db().execute('SELECT DISTINCT action FROM audit_events');
  for(const action of ['record.draft','record.publish','content.draft','content.publish','site-image.draft','site-image.publish']){
   assert.ok(events.some(event=>event.action===action),action);
  }
  console.log('Combined logo, hero, member and NGO description workflow PASS');
  await visitor.goto(origin);
 }
 await fs.mkdir('.qa/screenshots',{recursive:true});
 await admin.screenshot({path:'.qa/screenshots/site-image-admin.png',fullPage:true});
 for(const width of [1440,1280,768,390,360]){
  await visitor.setViewportSize({width,height:900});
  assert.equal(await visitor.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await visitor.screenshot({path:'.qa/screenshots/site-image-home-'+width+'.png',fullPage:true});
 }
 console.log('Homepage horizontal overflow and screenshots PASS at 1440, 1280, 768, 390 and 360px');
 if(process.env.SAMPARK_COMBINED_CMS==='1'){
  const {publicRoutes}=await import('../server/seo.js');
  const routes=[...Object.keys(publicRoutes),'/programs/'+fixture.programme,'/activities/synthetic-activity'];
  const screenshotRoutes=new Set(['/','/about','/programs','/gallery','/team','/contact','/donate','/transparency','/join-us','/policies/privacy']);
  const errors=[];
  visitor.on('pageerror',error=>errors.push(error.message));
  const results=[];
  for(const width of [1440,1280,768,390,360]){
   await visitor.setViewportSize({width,height:900});
   for(const route of routes){
    const response=await visitor.goto(origin+route,{waitUntil:'networkidle'});
    const state=await visitor.evaluate(()=>({
     headings:document.querySelectorAll('h1').length,
     overflow:document.documentElement.scrollWidth>innerWidth+1,
     broken:[...document.images].filter(image=>image.complete&&!image.naturalWidth).map(image=>image.getAttribute('src'))
    }));
    results.push({width,route,status:response.status(),...state});
    if(screenshotRoutes.has(route))await visitor.screenshot({path:'.qa/screenshots/cms-'+(route.slice(1).replaceAll('/','-')||'home')+'-'+width+'.png',fullPage:true});
   }
  }
  const failures=results.filter(item=>item.status!==200||item.headings!==1||item.overflow||item.broken.length);
  await fs.writeFile('.qa/cms-browser.json',JSON.stringify({results,failures,errors},null,2));
  assert.deepEqual(failures,[]);
  assert.deepEqual(errors,[]);
  await visitor.goto(origin);
  const toggle=visitor.getByRole('button',{name:'Toggle navigation'});
  await toggle.click();
  await visitor.getByRole('navigation').getByRole('link',{name:'Contact',exact:true}).focus();
  await visitor.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await visitor.getByText('How can I help?',{exact:true}).click();
  assert.equal(await visitor.locator('.site-faq').getAttribute('open'),'');
  await visitor.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await visitor.locator('.hero-copy').evaluate(element=>getComputedStyle(element).animationName),'none');
  await visitor.goto(origin+'/gallery');
  await visitor.locator('.gallery-trigger').first().click();
  await visitor.locator('dialog[open]').waitFor();
  await visitor.keyboard.press('Escape');
  assert.equal(await visitor.locator('dialog[open]').count(),0);
  console.log(results.length+' public route/viewport checks PASS, plus mobile navigation, FAQ, reduced motion and gallery keyboard checks');
 }
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
 await db().end();
}
