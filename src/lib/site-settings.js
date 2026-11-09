export const siteSettingsSlug='site-settings';
export const homeSections=['hero','introduction','mission','programmes','gallery','transparency','volunteer','donation','impact','testimonials','faq'];
const localLink=value=>typeof value==='string'&&/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*(?:#[a-z0-9-]+)?$/.test(value);
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const list=(value,max,check)=>Array.isArray(value)&&value.length<=max&&value.every(check);
const link=value=>value&&text(value.label,80)&&localLink(value.to);

export function parseSiteSettings(body){
 let data;
 try{data=JSON.parse(body)}catch{return null}
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const {navigation,home,faq,footer,heroAction,metadata,mission,vision,history,impact,testimonials}=data;
 if(navigation!==undefined&&(!list(navigation,12,link)||new Set(navigation.map(item=>item.to)).size!==navigation.length))return null;
 if(home!==undefined&&(!list(home,homeSections.length,key=>homeSections.includes(key))||!home.includes('hero')||new Set(home).size!==home.length))return null;
 if(faq!==undefined&&!list(faq,20,item=>item&&text(item.question,180)&&text(item.answer,1200)))return null;
 if(footer!==undefined&&!text(footer,1000))return null;
 if(heroAction!==undefined&&!link(heroAction))return null;
 if(metadata!==undefined&&(!metadata||typeof metadata!=='object'||Array.isArray(metadata)||Object.entries(metadata).length>80||
  !Object.entries(metadata).every(([path,value])=>localLink(path)&&!path.includes('#')&&value&&text(value.title,120)&&text(value.description,300))))return null;
 if([mission,vision,history].some(value=>value!==undefined&&!text(value,3000)))return null;
 if(impact!==undefined&&!list(impact,12,item=>item&&text(item.value,40)&&text(item.label,120)))return null;
 if(testimonials!==undefined&&!list(testimonials,12,item=>item&&text(item.quote,1200)&&text(item.name,120)))return null;
 return {navigation,home,faq,footer,heroAction,metadata,mission,vision,history,impact,testimonials};
}
