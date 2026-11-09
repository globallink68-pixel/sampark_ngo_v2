import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
import sharp from 'sharp';
import bcrypt from 'bcryptjs';
import assert from 'node:assert/strict';
import {baselineFingerprint,adoptSyntheticBaseline} from './lib/baseline-adoption.mjs';
import {runMigrations} from '../server/migrations.js';
const snapshot=JSON.parse(await fs.readFile(new URL('../tests/fixtures/observed-baseline-schema.json',import.meta.url),'utf8'));
const comparison=snapshot;
const schema=snapshot.schema,stamp=Date.now();
const config={host:'127.0.0.1',port:33379,user:'root',password:'synthetic-local-only'};
const database=`sampark_adoption_${stamp}`,failureDatabase=`sampark_adoption_${stamp+1}`;
const review={reference:`synthetic-schema-review-${stamp}`,schema_sha256:baselineFingerprint(schema),accepted_differences:['organization_settings.column_order'],migration_files:comparison.migration_files.slice(0,5)};
const order=['admins','gallery_items','members','contact_messages','donations','webhook_events','programs','organization_settings','contact_interactions'];
const results=[];const check=async(name,fn)=>{try{await fn();results.push({name,status:'PASS'})}catch(error){results.push({name,status:'FAIL',error:error.message});throw error}};
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const originalColumns=Object.fromEntries(schema.map(t=>[t.name,t.ddl.split('\n').map(line=>line.match(/^\s*`([^`]+)` /)?.[1]).filter(Boolean)]));
const definitions=ddl=>ddl.split('\n').slice(1,-1).map(line=>line.trim().replace(/,$/,'')).filter(line=>!/^`(?:active|role)` /.test(line));
async function createFixture(c,name){assert.match(name,/^sampark_adoption_\d+$/);await c.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);await c.changeUser({database:name});await c.query('SET SESSION sql_mode=?',[snapshot.database_runtime.sql_mode]);await c.query("SET SESSION time_zone='+00:00'");const [[session]]=await c.query('SELECT @@session.sql_mode AS mode,@@session.time_zone AS timezone');assert.equal(session.mode,snapshot.database_runtime.sql_mode);assert.equal(session.timezone,'+00:00');for(const table of order)await c.query(schema.find(t=>t.name===table).ddl.replace(/AUTO_INCREMENT=\d+\s*/g,''));}
async function records(c){const data={};for(const table of schema){const [rows]=await c.query('SELECT '+originalColumns[table.name].map(n=>'`'+n+'`').join(',')+' FROM `'+table.name+'` ORDER BY id');data[table.name]=rows;}return data;}
async function allRecords(c){const [tables]=await c.query('SHOW TABLES');const data={};for(const row of tables){const table=Object.values(row)[0];const [rows]=await c.query('SELECT * FROM `'+table+'` ORDER BY 1');data[table]=rows;}return data;}
const c=await mysql.createConnection(config);let failure;
await fs.mkdir('.qa/adoption-rehearsal',{recursive:true});
try{
 await check('reconstruct only observed DDL in isolated database',()=>createFixture(c,database));
 await check('seed explicitly synthetic identifiers and financial records',async()=>{
  await c.execute('INSERT INTO admins(id,email,password_hash) VALUES (7,?,?)',['synthetic-adoption@example.test',await bcrypt.hash('Synthetic-adoption-passphrase',10)]);
  await c.query("INSERT INTO contact_messages(id,name,email,subject,message) VALUES (12,'Synthetic enquiry','synthetic@example.test','Synthetic adoption test','No production data')");
  await c.query("INSERT INTO contact_interactions(id,contact_message_id,interaction_type,note,interaction_at) VALUES (14,12,'note','Synthetic interaction','2026-01-02 03:04:05')");
  await c.query("INSERT INTO donations(id,donor_name,donor_email,amount,currency,status,razorpay_order_id,razorpay_payment_id) VALUES (101,'Synthetic donor','synthetic@example.test',12345,'INR','paid','synthetic-order-101','synthetic-payment-101'),(203,'Synthetic donor','synthetic@example.test',99999,'INR','created','synthetic-order-203',NULL),(309,'Synthetic donor','synthetic@example.test',500,'INR','failed','synthetic-order-309',NULL)");
  await c.query("INSERT INTO gallery_items(id,title,image_path) VALUES (22,'Synthetic gallery','uploads/gallery/synthetic.webp')");
  await c.query("INSERT INTO members(id,name,designation) VALUES (23,'Synthetic member','Volunteer')");
  await c.query("INSERT INTO programs(id,title,image_path) VALUES (25,'Synthetic programme','uploads/programs/synthetic.webp')");
  await c.query("INSERT INTO organization_settings(id,organization_name,primary_email,primary_phone,threads_url,x_url) VALUES (1,'Synthetic organisation','synthetic@example.test','9999999999','https://example.test/threads','https://example.test/x')");
  await c.execute("INSERT INTO webhook_events(id,provider,event_id,event_type,payload_hash) VALUES (44,'synthetic','synthetic-event','fixture',?)",['0'.repeat(64)]);
 });
 const before=await records(c);const beforeHash=hash(JSON.stringify(before));
 const [beforeCounters]=await c.query('SELECT TABLE_NAME AS name,AUTO_INCREMENT AS next_id FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME');
 const mediaRoot=path.resolve('.qa/adoption-rehearsal/media');await fs.mkdir(mediaRoot,{recursive:true});const media=await sharp({create:{width:8,height:8,channels:3,background:'#0a6664'}}).webp().toBuffer();await fs.writeFile(path.join(mediaRoot,'synthetic.webp'),media);const mediaHash=hash(media);
 await check('unchanged migration runner refuses observed database without ledger',async()=>{await assert.rejects(runMigrations(c),/provenance/i);const [rows]=await c.query("SHOW TABLES LIKE 'schema_migrations'");assert.equal(rows.length,0)});
 await check('review fingerprint refuses unexpected financial column type',async()=>{await c.query('ALTER TABLE donations MODIFY amount bigint NOT NULL');await assert.rejects(adoptSyntheticBaseline(c,review),/fingerprint/i);const [rows]=await c.query("SHOW TABLES LIKE 'schema_migrations'");assert.equal(rows.length,0);await c.query('ALTER TABLE donations MODIFY amount int NOT NULL')});
 await check('checksum mismatch refuses adoption before ledger DDL',async()=>{const invalid={...review,migration_files:review.migration_files.map((f,i)=>i?f:{...f,sha256:'f'.repeat(64)})};await assert.rejects(adoptSyntheticBaseline(c,invalid),/checksum/i);const [rows]=await c.query("SHOW TABLES LIKE 'schema_migrations%'");assert.equal(rows.length,0)});
 await check('adopt explicitly reviewed schema without running migrations 001-005',async()=>{assert.equal((await adoptSyntheticBaseline(c,review)).status,'ADOPTED');assert.deepEqual(await records(c),before)});
 await check('baseline adoption is idempotent before upgrade',async()=>{assert.equal((await adoptSyntheticBaseline(c,review)).status,'ALREADY_ADOPTED');const [[row]]=await c.query('SELECT COUNT(*) AS count FROM schema_migrations');assert.equal(row.count,5)});
 await check('adoption entries do not claim historical migration execution',async()=>{const [rows]=await c.query('SELECT provenance,applied_at,adopted_at,baseline_sha256 FROM schema_migrations');assert.ok(rows.every(r=>r.provenance==='adopted_schema'&&r.applied_at===null&&r.adopted_at&&r.baseline_sha256===review.schema_sha256))});
 await check('unchanged runner applies only additive migrations 006-008',async()=>{await runMigrations(c);const [rows]=await c.query('SELECT filename,provenance,applied_at FROM schema_migrations ORDER BY filename');assert.equal(rows.length,8);assert.ok(rows.slice(0,5).every(r=>r.provenance==='adopted_schema'&&r.applied_at===null));assert.ok(rows.slice(5).every(r=>r.provenance==='executed'&&r.applied_at))});
 await check('every original row, identifier and timestamp is preserved',async()=>{assert.deepEqual(await records(c),before);assert.equal(hash(JSON.stringify(await records(c))),beforeHash)});
 await check('all original column types, keys, foreign keys and collations survive',async()=>{for(const table of schema){const [[row]]=await c.query('SHOW CREATE TABLE `'+table.name+'`');const ddl=row['Create Table'];const normalize=value=>table.name==='admins'?definitions(value):value.split('\n').slice(1,-1).map(line=>line.trim().replace(/,$/,''));assert.deepEqual(normalize(ddl),normalize(table.ddl));assert.match(ddl,/ENGINE=InnoDB/);assert.match(ddl,/COLLATE=utf8mb4_uca1400_ai_ci/);}});
 await check('auto-increment positions are preserved across adoption and upgrade',async()=>{const [after]=await c.query('SELECT TABLE_NAME AS name,AUTO_INCREMENT AS next_id FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME');assert.deepEqual(after.filter(t=>order.includes(t.name)),beforeCounters)});
 await check('financial amounts, statuses and provider identifiers remain exact',async()=>{const [rows]=await c.query('SELECT id,amount,status,razorpay_order_id,razorpay_payment_id FROM donations ORDER BY id');assert.deepEqual(rows.map(r=>[r.id,r.amount,r.status]),[[101,12345,'paid'],[203,99999,'created'],[309,500,'failed']]);assert.equal(rows[0].razorpay_payment_id,'synthetic-payment-101')});
 await check('existing admin identity gains only documented defaults',async()=>{const [[row]]=await c.query('SELECT id,active,role,password_hash FROM admins WHERE id=7');assert.equal(row.active,1);assert.equal(row.role,'admin');assert.equal(row.password_hash,before.admins[0].password_hash)});
 await check('public image file content remains unchanged',async()=>assert.equal(hash(await fs.readFile(path.join(mediaRoot,'synthetic.webp'))),mediaHash));
 await check('second migration run changes no rows or migration records',async()=>{const state=await allRecords(c);await runMigrations(c);assert.deepEqual(await allRecords(c),state)});
 await check('interrupted adoption leaves refusal guard intact',async()=>{
  failure=await mysql.createConnection(config);await createFixture(failure,failureDatabase);let inserts=0;
  const wrapped={config:failure.config,query:failure.query.bind(failure),beginTransaction:failure.beginTransaction.bind(failure),commit:failure.commit.bind(failure),rollback:failure.rollback.bind(failure),execute:async(...args)=>{if(args[0].includes('INSERT INTO schema_migrations_pending_review')&&++inserts===2)throw Error('Synthetic interruption');return failure.execute(...args)}};
  await assert.rejects(adoptSyntheticBaseline(wrapped,review),/Synthetic interruption/);const [[pending]]=await failure.query('SELECT COUNT(*) AS count FROM schema_migrations_pending_review');assert.equal(pending.count,0);const [visible]=await failure.query("SHOW TABLES LIKE 'schema_migrations'");assert.equal(visible.length,0);await assert.rejects(runMigrations(failure),/provenance/i);
 });
}finally{
 const output={captured_utc:new Date().toISOString(),fixture_database:database,interruption_fixture:failureDatabase,production_connection_used:false,production_mutation:false,session_equivalence:{sql_mode:snapshot.database_runtime.sql_mode,time_zone:'+00:00',production_system_timezone:snapshot.database_runtime.system_timezone},source:'Previously captured production DDL only; every data row and image is synthetic',review,results,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,limitations:['Production adoption not authorised or executed','No applied-history provenance inferred','Actual production rows, uploads, backup/restore, cutover and persistence not rehearsed','Adoption helper is hard-restricted to local fixture port and names; not a production adoption command']};
 await fs.writeFile('.qa/adoption-rehearsal/results.json',JSON.stringify(output,null,2));await c.end();if(failure)await failure.end();
}
console.log(JSON.stringify({passed:results.length,failed:0,database,production_mutation:false}));
