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
 await fs.mkdir('.qa/screenshots',{recursive:true});
 await admin.screenshot({path:'.qa/screenshots/site-image-admin.png',fullPage:true});
 for(const width of [1440,1280,768,390,360]){
  await visitor.setViewportSize({width,height:900});
  assert.equal(await visitor.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await visitor.screenshot({path:'.qa/screenshots/site-image-home-'+width+'.png',fullPage:true});
 }
 console.log('Homepage horizontal overflow and screenshots PASS at 1440, 1280, 768, 390 and 360px');
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
 await db().end();
}
