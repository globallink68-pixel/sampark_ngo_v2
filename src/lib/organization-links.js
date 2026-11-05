export const optionalText=value=>typeof value==='string'?value.trim():'';
export const externalUrl=value=>{const url=optionalText(value);return /^https?:\/\//i.test(url)?url:''};
export const emailUrl=value=>{const email=optionalText(value);return email?`mailto:${email}`:''};
export const phoneUrl=value=>{const phone=optionalText(value);return phone?`tel:${phone}`:''};
export const whatsappUrl=value=>{const number=optionalText(value).replace(/\D/g,'');return number?`https://wa.me/${number}`:''};
export const isExternalUrl=value=>externalUrl(value)!=='';
export const socialLinks=(organization,{whatsapp=false}={})=>{const source=organization&&typeof organization==='object'?organization:{};return [['facebook','Facebook',externalUrl(source.facebook_url)],['instagram','Instagram',externalUrl(source.instagram_url)],['youtube','YouTube',externalUrl(source.youtube_url)],['linkedin','LinkedIn',externalUrl(source.linkedin_url)],['threads','Threads',externalUrl(source.threads_url)],['x','X (Twitter)',externalUrl(source.x_url)],...(whatsapp?[['chat','WhatsApp',whatsappUrl(source.whatsapp_number)]]:[])].filter(([, ,url])=>url)};
