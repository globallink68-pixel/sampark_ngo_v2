import {it,expect} from 'vitest';
import {migrationStatements} from '../server/migrations.js';
it('splits trusted migration files into individual statements',()=>{expect(migrationStatements('CREATE TABLE a(id int); CREATE TABLE b(id int);')).toHaveLength(2)});
it('rejects unreviewed database adoption',async()=>{const {runMigrations}=await import('../server/migrations.js');const connection={execute:async sql=>sql.includes('information_schema')?[[{name:'admins'}]]:[[]]};await expect(runMigrations(connection)).rejects.toThrow(/provenance/i)});
