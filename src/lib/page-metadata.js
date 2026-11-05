export function applyPageMetadata(document,metadata){
 if(!metadata?.title)return;
 document.title=String(metadata.title)+' | Sampark Skill Academy';
 for(const [attribute,key,value] of [['name','description',metadata.description],['name','robots',metadata.noindex?'noindex, nofollow':'index, follow'],['property','og:title',document.title],['property','og:description',metadata.description]]){
  let tag=document.head.querySelector(`meta[${attribute}="${key}"]`);
  if(!tag){tag=document.createElement('meta');tag.setAttribute(attribute,key);document.head.appendChild(tag)}
  tag.content=String(value||'');
 }
 let canonical=document.head.querySelector('link[rel=canonical]');
 if(metadata.canonical){if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical)}canonical.href=metadata.canonical}else canonical?.remove();
}
