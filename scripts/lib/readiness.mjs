export function loopbackListenArgs(args){
 const first=args[0];const options=typeof first==='object'&&first!==null?first:{port:first};
 if(options.path||!/^\d+$/.test(String(options.port))||Number(options.port)<1||Number(options.port)>65535)throw Error('Verification listener requires a valid TCP port');
 const callback=args.slice(1).find(value=>typeof value==='function');
 return [{...options,port:Number(options.port),host:'127.0.0.1'},...(callback?[callback]:[])];
}
export async function waitForReadiness(child,url,{timeoutMs=30000,pollMs=100,request=fetch,getSpawnError=()=>null}={}){
 if(!['127.0.0.1','localhost','[::1]','::1'].includes(new URL(url).hostname))throw Error('Readiness verification requires loopback');
 const started=Date.now(),deadline=started+timeoutMs;let attempts=0,lastError=null;
 while(Date.now()<deadline){
  const spawnError=getSpawnError();if(spawnError)throw Error('Child failed to spawn: '+spawnError);
  if(child.exitCode!==null&&child.exitCode!==undefined||child.signalCode)throw Error('Child exited before readiness: '+(child.exitCode??child.signalCode));
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Math.min(1000,deadline-Date.now()));
  try{attempts++;const response=await request(url,{signal:controller.signal});if(response.ok)return {ready_elapsed_ms:Date.now()-started,attempts,last_connection_error:lastError};lastError='HTTP '+response.status;}catch(error){lastError=error.cause?.code||error.code||error.name;}finally{clearTimeout(timer);}
  const remaining=deadline-Date.now();if(remaining>0)await new Promise(resolve=>setTimeout(resolve,Math.min(pollMs,remaining)));
 }
 throw Error('Readiness deadline exceeded; last safe diagnostic: '+lastError);
}
