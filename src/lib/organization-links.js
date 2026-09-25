export const optionalText=value=>typeof value==='string'?value.trim():'';
export const externalUrl=value=>{const url=optionalText(value);return /^https?:\/\//i.test(url)?url:''};
export const emailUrl=value=>{const email=optionalText(value);return email?`mailto:${email}`:''};
export const phoneUrl=value=>{const phone=optionalText(value);return phone?`tel:${phone}`:''};
export const whatsappUrl=value=>{const number=optionalText(value).replace(/\D/g,'');return number?`https://wa.me/${number}`:''};
export const isExternalUrl=value=>externalUrl(value)!=='';
