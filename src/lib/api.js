const configuredBase=()=>import.meta.env.VITE_API_BASE_URL||'';

export const apiBase=value=>String(value??configuredBase()).replace(/\/+$/,'');
export const apiUrl=(route,base)=>`${apiBase(base)}${route.startsWith('/')?route:`/${route}`}`;

export const publicImageUrl=(storedPath,base)=>{
  if(!storedPath)return '';
  if(/^https?:\/\//i.test(storedPath))return storedPath;
  return `${apiBase(base)}/${String(storedPath).replace(/^\/+/, '')}`;
};

export async function fetchPublicCollection(route,{fetcher=globalThis.fetch,base}={}){
  let response;
  try{response=await fetcher(apiUrl(route,base))}catch{throw Error('Public API unavailable')}
  if(!response?.ok)throw Error('Public API unavailable');
  try{const data=await response.json();if(!Array.isArray(data))throw Error('Unexpected response');return data}catch{throw Error('Public API unavailable')}
}

export class AdminApiError extends Error{constructor(status){super('Admin API unavailable');this.status=status}}

export async function adminRequest(route,{method='GET',body,fetcher=globalThis.fetch,base}={}){
  const headers={};
  if(body&&!(body instanceof globalThis.FormData))headers['Content-Type']='application/json';
  let response;
  try{response=await fetcher(apiUrl(route,base),{method,headers,body:body&&!(body instanceof globalThis.FormData)?JSON.stringify(body):body,credentials:'include'})}catch{throw new AdminApiError(0)}
  if(!response?.ok)throw new AdminApiError(response?.status||0);
  if(response.status===204)return null;
  try{return await response.json()}catch{throw new AdminApiError(response.status)}
}
