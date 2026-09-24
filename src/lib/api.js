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
