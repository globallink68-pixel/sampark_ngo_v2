import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const names=['admins','contact_interactions','contact_messages','donations','gallery_items','members','organization_settings','programs','webhook_events'];
const migrationRoot=fileURLToPath(new URL('../../database/migrations/',import.meta.url));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
export function baselineFingerprint(schema){
 return hash(JSON.stringify([...schema].sort((a,b)=>a.name.localeCompare(b.name)).map(t=>({name:t.name,engine:t.engine,collation:t.collation,ddl:t.ddl.replace(/\r\n/g,'\n').replace(/AUTO_INCREMENT=\d+\s*/g,'').trim()}))));
}
export function reviewBaseline(schema,review){
 if(!review?.reference||review.reference.length>255||!review.accepted_differences?.includes('organization_settings.column_order'))throw Error('Explicit review and column-order acknowledgement required');
 if(JSON.stringify(schema.map(t=>t.name).sort())!==JSON.stringify(names))throw Error('Unexpected baseline table set');
 const fingerprint=baselineFingerprint(schema);
 if(fingerprint!==review.schema_sha256)throw Error('Reviewed schema fingerprint mismatch; refusing adoption');
 return {type:'observed_schema_adoption',schema_sha256:fingerprint,review_reference:review.reference,historical_execution_proven:false,accepted_differences:review.accepted_differences};
}
async function inspect(connection){
 const [tables]=await connection.query('SELECT TABLE_NAME AS name,ENGINE AS engine,TABLE_COLLATION AS collation FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME');
 const schema=[];
 for(const table of tables.filter(t=>names.includes(t.name))){const [[row]]=await connection.query('SHOW CREATE TABLE `'+table.name+'`');schema.push({...table,ddl:row['Create Table']});}
 return {tables,schema};
}
// Rehearsal only. This helper deliberately cannot adopt a production database.
// A separately reviewed operator procedure is still required for production.
export async function adoptSyntheticBaseline(connection,review){
 if(!['127.0.0.1','localhost','::1'].includes(connection.config?.host)||Number(connection.config?.port)!==33379||connection.config?.socketPath||connection.config?.stream)throw Error('Adoption helper requires the isolated loopback fixture without socket or stream overrides');
 const [[database]]=await connection.query('SELECT DATABASE() AS name');
 if(!/^sampark_adoption_\d+$/.test(database.name))throw Error('Refusing non-isolated database name');
 const [[lock]]=await connection.query("SELECT GET_LOCK('sampark_schema_migration',10) AS acquired");if(Number(lock.acquired)!==1)throw Error('Migration lock unavailable');
 try{
  const {tables,schema}=await inspect(connection);const plan=reviewBaseline(schema,review);
  if(tables.some(t=>!names.includes(t.name)&&t.name!=='schema_migrations'))throw Error('Unexpected additional table; explicit review required');
  const files=review.migration_files;
  if(!Array.isArray(files)||files.length!==5||files.some((f,i)=>!f.file.startsWith(String(i+1).padStart(3,'0')+'_')||path.basename(f.file)!==f.file))throw Error('Reviewed migration checksum manifest required');
  for(const file of files)if(hash(await fs.readFile(path.join(migrationRoot,file.file)))!==file.sha256)throw Error('Reviewed migration file checksum mismatch');
  if(tables.some(t=>t.name==='schema_migrations')){
   const [rows]=await connection.query('SELECT filename,checksum,provenance,baseline_sha256,review_reference,applied_at FROM schema_migrations ORDER BY filename');
   if(rows.length!==5||rows.some((r,i)=>r.filename!==files[i].file||r.checksum!==files[i].sha256||r.provenance!=='adopted_schema'||r.baseline_sha256!==plan.schema_sha256||r.review_reference!==plan.review_reference||r.applied_at!==null))throw Error('Existing ledger is not this reviewed baseline');
   return {...plan,status:'ALREADY_ADOPTED'};
  }
  // Prepare a complete ledger under a different name. Until atomic rename,
  // the unchanged migration runner must continue refusing this database.
  await connection.query("CREATE TABLE schema_migrations_pending_review(filename varchar(255) PRIMARY KEY,checksum char(64) NOT NULL,applied_at timestamp NULL DEFAULT current_timestamp,provenance varchar(20) NOT NULL DEFAULT 'executed',baseline_sha256 char(64),review_reference varchar(255),adopted_at timestamp NULL DEFAULT NULL) ENGINE=InnoDB CHARSET=utf8mb4");
  await connection.beginTransaction();
  try{for(const file of files)await connection.execute("INSERT INTO schema_migrations_pending_review(filename,checksum,applied_at,provenance,baseline_sha256,review_reference,adopted_at) VALUES (?,?,NULL,'adopted_schema',?,?,NOW())",[file.file,file.sha256,plan.schema_sha256,plan.review_reference]);await connection.commit();}catch(error){await connection.rollback();throw error;}
  await connection.query('RENAME TABLE schema_migrations_pending_review TO schema_migrations');
  return {...plan,status:'ADOPTED'};
 }finally{await connection.query("SELECT RELEASE_LOCK('sampark_schema_migration')");}
}
