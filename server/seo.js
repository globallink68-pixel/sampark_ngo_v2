const site='Sampark Skill Academy';
const description='Practical learning, personal growth and community participation. Confirm current availability with the academy.';
export const publicRoutes={
 '/':'Skills for life','/about':'About us','/our-work':'Our work','/programs':'Programmes','/gallery':'Gallery','/team':'Our people','/members':'Public profiles','/contact':'Contact us','/donate':'Donation information','/transparency':'Transparency','/join-us':'Get involved','/volunteer':'Volunteer application','/internship':'Internship application','/membership':'Membership application','/csr':'CSR enquiries','/pickup':'Collection enquiries','/sponsor':'Sponsorship enquiries','/sponsors':'Sponsorship enquiries','/campaigns':'Campaigns','/activities':'Activities','/search':'Search','/verify-member':'Member verification unavailable',
 ...Object.fromEntries(['privacy','terms','donation','refund','volunteer'].map(slug=>['/policies/'+slug,slug[0].toUpperCase()+slug.slice(1)+' policy']))
};
const adminRoutes=new Set(['','/login','/gallery','/members','/programs','/organization','/messages','/donations','/applications','/content','/audit'].map(p=>'/admin'+p));
export const escapeMarkup=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function originUrl(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.origin:null}catch{return null}}
export const normalizeRoute=route=>route==='/'?'/':route.replace(/\/+$/,'').toLowerCase();
export async function routeMetadata(route,execute){
 route=normalizeRoute(route);
 if(adminRoutes.has(route))return {status:200,title:'Administration',description:'Authorised administration only.',noindex:true};
 if(publicRoutes[route])return {status:200,title:publicRoutes[route],description,noindex:['/search','/verify-member'].includes(route)};
 let match=route.match(/^\/programs\/(\d+)$/);
 if(match){const [rows]=await execute('SELECT title,short_description FROM programs WHERE id=? AND active=1 AND public_visible=1',[match[1]]);if(rows[0])return {status:200,title:rows[0].title,description:rows[0].short_description||description,noindex:false};}
 match=route.match(/^\/(campaigns|activities|pages)\/([a-z0-9-]{1,100})$/);
 if(match){const kind={campaigns:'campaign',activities:'activity',pages:'page'}[match[1]];const [rows]=await execute('SELECT title,body FROM content_pages WHERE slug=? AND kind=? AND published=1',[match[2],kind]);if(rows[0])return {status:200,title:rows[0].title,description:String(rows[0].body).slice(0,180),noindex:false};}
 return {status:404,title:'Page not found',description:'The requested page is not available.',noindex:true};
}
export function renderMetadata(html,metadata,route,origin){
 const tags=`<title>${escapeMarkup(metadata.title)} | ${site}</title><meta name="description" content="${escapeMarkup(metadata.description)}"><meta name="robots" content="${metadata.noindex?'noindex, nofollow':'index, follow'}">${origin?`<link rel="canonical" href="${escapeMarkup(origin+route)}">`:''}<meta property="og:title" content="${escapeMarkup(metadata.title)} | ${site}"><meta property="og:description" content="${escapeMarkup(metadata.description)}"><meta property="og:type" content="website">`;
 let output=html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\s+[^>]*(?:name=["'](?:description|robots)["']|property=["']og:[^"']+["'])[^>]*>/gi,'').replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi,'');
 return /<head\b[^>]*>/i.test(output)?output.replace(/<head\b[^>]*>/i,head=>head+tags):output.replace(/<html\b[^>]*>/i,html=>html+'<head>'+tags+'</head>');
}
