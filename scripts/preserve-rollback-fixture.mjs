import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const manifest=JSON.parse((await fs.readFile('release/DEPLOYMENT_MANIFEST.json','utf8')).replace(/^\uFEFF/,''));
const source=path.resolve('.qa/release-final'),target=path.resolve('.qa/rollback-c0e7887a');
try{await fs.access(target);throw Error('Rollback snapshot already exists; refusing overwrite')}catch(error){if(error.code!=='ENOENT')throw error;}
for(const file of manifest.files){const input=path.resolve(source,file.path);if(!input.startsWith(source+path.sep))throw Error('Unsafe manifest path');const bytes=await fs.readFile(input);if(crypto.createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('Prior release source differs: '+file.path);const output=path.join(target,file.path);await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,bytes,{flag:'wx'});}
await fs.cp(path.join(source,'dist'),path.join(target,'dist'),{recursive:true,errorOnExist:true,force:false});
await fs.writeFile(path.join(target,'ROLLBACK_SOURCE.json'),JSON.stringify({source_zip_sha256:manifest.sha256,files_verified:manifest.files.length,scope:'Prior payment-retired local release; not claimed identical to active Hostinger release'},null,2));
console.log(JSON.stringify({snapshot:target,files_verified:manifest.files.length,source_zip_sha256:manifest.sha256}));
