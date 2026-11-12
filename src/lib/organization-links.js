export const optionalText=value=>typeof value==='string'?value.trim():'';
export function externalUrl(value){
 const url=optionalText(value);
 if(!/^https?:\/\/[^/\\\s]/i.test(url)||/[\s\\]/.test(url))return '';
 try{
  const parsed=new URL(url);
  return parsed.hostname&&!parsed.username&&!parsed.password?url:'';
 }catch{return ''}
}
export const emailUrl=value=>{const email=optionalText(value);return email?`mailto:${email}`:''};
export const phoneUrl=value=>{const phone=optionalText(value);return phone?`tel:${phone}`:''};
export function whatsappUrl(value){
 const input=optionalText(value);
 if(!/^\+?[\d() -]+$/.test(input))return '';
 let number=input.replace(/\D/g,'');
 if(input.startsWith('00'))number=number.slice(2);
 else if(!input.startsWith('+')){
  if(/^[6-9]\d{9}$/.test(number))number='91'+number;
  else if(!/^91[6-9]\d{9}$/.test(number))return '';
 }
 return /^[1-9]\d{7,14}$/.test(number)&&(!number.startsWith('91')||/^91[6-9]\d{9}$/.test(number))
  ?`https://wa.me/${number}`:'';
}
export const isExternalUrl=value=>externalUrl(value)!=='';
export const socialLinks=(organization,{whatsapp=false}={})=>{const source=organization&&typeof organization==='object'?organization:{};return [['facebook','Facebook',externalUrl(source.facebook_url)],['instagram','Instagram',externalUrl(source.instagram_url)],['youtube','YouTube',externalUrl(source.youtube_url)],['linkedin','LinkedIn',externalUrl(source.linkedin_url)],['threads','Threads',externalUrl(source.threads_url)],['x','X (Twitter)',externalUrl(source.x_url)],...(whatsapp?[['chat','WhatsApp',whatsappUrl(source.whatsapp_number)]]:[])].filter(([, ,url])=>url)};
