import '../config/env.js';
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import {db} from '../config/db.js';
const pool=db();
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
try{const email=(process.env.ADMIN_EMAIL||await rl.question('Admin email: ')).trim().toLowerCase();const password=process.env.ADMIN_PASSWORD||await rl.question('Admin password (visible; use protected environment injection on shared terminals): ');if(!/^\S+@\S+\.\S+$/.test(email)||password.length<12)throw Error('Use a valid email and password of at least 12 characters.');const [rows]=await pool.execute('select id from admins where email=?',[email]);if(rows.length)throw Error('Admin already exists.');await pool.execute('insert into admins(email,password_hash) values(?,?)',[email,await bcrypt.hash(password,12)]);console.log('Admin created.')}finally{rl.close();await pool.end();}
