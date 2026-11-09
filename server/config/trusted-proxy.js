import {isIP} from 'node:net';

export function configureTrustedProxy(app,value=''){
 const peers=value.trim()?value.split(',').map(entry=>entry.trim()):[];
 for(const entry of peers){
  const [address,prefix,...extra]=entry.split('/');
  const version=isIP(address);
  const maxPrefix=version===4?32:128;
  if(!version||extra.length||prefix!==undefined&&(!/^\d{1,3}$/.test(prefix)||Number(prefix)<1||Number(prefix)>maxPrefix)){
   throw new Error('TRUSTED_PROXY_PEERS must contain explicit IP addresses or non-default CIDR ranges.');
  }
 }
 // Express compiles the allowlist with IPv4-mapped IPv6 support.
 app.set('trust proxy',peers);
 const allowed=app.get('trust proxy fn');
 app.set('trust proxy',(address,hop)=>hop===0&&allowed(address));
}
