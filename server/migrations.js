import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../database/migrations/',import.meta.url));
// Reviewed DDL only; no procedures or semicolons in literals.
export const migrationStatements=sql=>sql.split(';').map(s=>s.trim()).filter(Boolean);
export async function runMigrations(connection){
 const [tables]=await connection.execute('select table_name as name from information_schema.tables where table_schema=database()');
 if(tables.length&&!tables.some(t=>t.name==='schema_migrations'))throw Error('Migration provenance missing. Refusing adoption of an existing database; reconcile its schema in staging first.');
 await connection.execute('CREATE TABLE IF NOT EXISTS schema_migrations(filename varchar(255) PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamp DEFAULT current_timestamp) CHARSET=utf8mb4');
 const [locks]=await connection.execute("SELECT GET_LOCK('sampark_schema_migration',10) AS acquired");
 if(Number(locks[0]?.acquired)!==1)throw Error('Migration lock unavailable');
 try{
  for(const file of(await fs.readdir(root)).filter(f=>/^\d+.*\.sql$/.test(f)).sort()){
   const sql=await fs.readFile(path.join(root,file),'utf8'),checksum=crypto.createHash('sha256').update(sql).digest('hex');
   const [rows]=await connection.execute('SELECT checksum FROM schema_migrations WHERE filename=?',[file]);
   if(rows.length){if(rows[0].checksum!==checksum)throw Error(`Migration checksum mismatch: ${file}`);continue;}
   for(const statement of migrationStatements(sql))await connection.query(statement);
   await connection.execute('INSERT INTO schema_migrations(filename,checksum) VALUES (?,?)',[file,checksum]);
  }
 }finally{await connection.execute("SELECT RELEASE_LOCK('sampark_schema_migration')");}
}
