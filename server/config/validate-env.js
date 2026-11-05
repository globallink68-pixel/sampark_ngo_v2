import path from 'node:path';
export function validateEnvironment(values){
 const production=values.NODE_ENV==='production';
 if(!['development','test','production'].includes(values.NODE_ENV||'development'))throw Error('Invalid NODE_ENV');
 if(values.NODE_ENV==='test'&&!['127.0.0.1','localhost','::1'].includes(values.DB_HOST||'127.0.0.1'))throw Error('Tests require a loopback database');
 for(const key of ['PORT','DB_PORT'])if(values[key]&&(!/^\d+$/.test(values[key])||Number(values[key])<1||Number(values[key])>65535))throw Error(`Invalid ${key}`);
 if(production){
  for(const key of ['APP_ORIGIN','DB_HOST','DB_NAME','DB_USER','DB_PASSWORD','SESSION_SECRET','UPLOAD_ROOT'])if(!values[key]?.trim())throw Error(`Missing required server environment variable: ${key}`);
  if(values.SESSION_SECRET.length<32)throw Error('SESSION_SECRET must contain at least 32 characters');
  const origin=new URL(values.APP_ORIGIN);if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('APP_ORIGIN must be an HTTPS origin');
  if(!path.isAbsolute(values.UPLOAD_ROOT))throw Error('UPLOAD_ROOT must be absolute');
 }
 return {production,port:Number(values.PORT||3000)};
}
