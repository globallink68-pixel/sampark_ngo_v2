export const siteSettingsSlug='site-settings';
export const homeSections=['hero','introduction','mission','programmes','gallery','transparency','volunteer','donation','impact','testimonials','faq'];
const localLink=value=>typeof value==='string'&&/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*(?:#[a-z0-9-]+)?$/.test(value);
const shareImage=value=>typeof value==='string'&&/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/.test(value);
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const list=(value,max,check)=>Array.isArray(value)&&value.length<=max&&value.every(check);
const link=value=>value&&text(value.label,80)&&localLink(value.to);
export function googleReviewUrl(value){
 if(typeof value!=='string'||value.length>500)return '';
 try{
  const url=new URL(value);
  return url.origin==='https://www.google.com'&&!url.username&&!url.password&&
   /^\/maps\/place\/[^/]+/.test(url.pathname)?url.href:'';
 }catch{return ''}
}

const certificateReference=value=>value&&Number.isSafeInteger(value.id)&&value.id>0&&
 typeof value.validUntil==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.validUntil)&&
 new Date(value.validUntil).toJSON()?.slice(0,10)===value.validUntil;

export function parseSiteSettings(body){
 let data;
 try{data=JSON.parse(body)}catch{return null}
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const {navigation,home,faq,footer,heroAction,metadata,mission,vision,history,impact,testimonials,featuredProgrammes,programmeDescription,googleReviewsUrl,taxCertificates}=data;
 if(navigation!==undefined&&(!list(navigation,12,link)||new Set(navigation.map(item=>item.to)).size!==navigation.length))return null;
 if(home!==undefined&&(!list(home,homeSections.length,key=>homeSections.includes(key))||!home.includes('hero')||new Set(home).size!==home.length))return null;
 if(faq!==undefined&&!list(faq,20,item=>item&&text(item.question,180)&&text(item.answer,1200)))return null;
 if(footer!==undefined&&!text(footer,1000))return null;
 if(heroAction!==undefined&&!link(heroAction))return null;
 if(metadata!==undefined&&(!metadata||typeof metadata!=='object'||Array.isArray(metadata)||Object.entries(metadata).length>80||
  !Object.entries(metadata).every(([path,value])=>localLink(path)&&!path.includes('#')&&value&&text(value.title,120)&&text(value.description,300)&&(value.image===undefined||shareImage(value.image)))))return null;
 if([mission,vision,history].some(value=>value!==undefined&&!text(value,3000)))return null;
 if(impact!==undefined&&!list(impact,12,item=>item&&text(item.value,40)&&text(item.label,120)))return null;
 if(testimonials!==undefined&&!list(testimonials,12,item=>item&&text(item.quote,1200)&&text(item.name,120)))return null;
 if(googleReviewsUrl!==undefined&&!googleReviewUrl(googleReviewsUrl))return null;
 if(taxCertificates!==undefined&&(!taxCertificates||typeof taxCertificates!=='object'||Array.isArray(taxCertificates)||
  !Object.entries(taxCertificates).every(([key,value])=>['80g','12a'].includes(key)&&certificateReference(value))))return null;
 if(featuredProgrammes!==undefined&&(!list(featuredProgrammes,9,id=>Number.isSafeInteger(id)&&id>0)||new Set(featuredProgrammes).size!==featuredProgrammes.length))return null;
 if(programmeDescription!==undefined&&!text(programmeDescription,3000))return null;
 return {navigation,home,faq,footer,heroAction,metadata,mission,vision,history,impact,testimonials,featuredProgrammes,programmeDescription,googleReviewsUrl,taxCertificates};
}
