import '../config/env.js';
import {db} from '../config/db.js';
import {runMigrations} from '../migrations.js';
const pool=db();const connection=await pool.getConnection();
try{await runMigrations(connection);console.log('Migrations complete.')}finally{connection.release();await pool.end();}
