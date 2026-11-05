import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
const connection = await mysql.createConnection({host:'127.0.0.1',port:33379,user:'root',password:'synthetic-local-only',multipleStatements:true});
try {
  await connection.query('CREATE DATABASE IF NOT EXISTS sampark_synthetic CHARACTER SET utf8mb4');
  await connection.query('USE sampark_synthetic');
  const [tables] = await connection.query('SHOW TABLES');
  if(tables.length) throw Error('Synthetic bootstrap refuses a nonempty database');
  for(const file of (await fs.readdir('database/migrations')).sort()) await connection.query(await fs.readFile(`database/migrations/${file}`,'utf8'));
  await connection.execute('INSERT INTO admins(email,password_hash) VALUES (?,?)',['admin@example.test',await bcrypt.hash('Synthetic-only-passphrase-2026',10)]);
  await connection.execute('INSERT INTO programs(title,short_description,description,status) VALUES (?,?,?,?)',['Synthetic training programme','Synthetic QA content','Local QA record; not an academy activity claim.','upcoming']);
  console.log('Synthetic database created on loopback port 33379; no production connection.');
} finally {await connection.end();}
