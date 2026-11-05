// Stateful database adapter for existing controller tests. Real MariaDB session
// behavior is tested separately by scripts/verify-integration.mjs.
export function sessionDatabase(execute){
 const sessions=new Map();
 return async(sql,params=[])=>{
  if(sql.startsWith('update admins set session_token=?,expires_at=?')){sessions.set(params[2],{session_token:params[0],expires_at:params[1]});return [{affectedRows:1}];}
  if(sql.startsWith('update admins set session_token=NULL')){sessions.delete(params[0]);return [{affectedRows:1}];}
  const result=await execute(sql,params);
  if(sql.startsWith('select id,email,password_hash,active,role'))return [result[0].map(r=>({active:1,role:'admin',...r}))];
  if(sql.startsWith('select id,active,role,session_token,expires_at'))return [result[0].map(r=>({active:1,role:'admin',...sessions.get(r.id),...r}))];
  return result;
 };
}
