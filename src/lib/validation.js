export const imageOk=f=>!!f&&['image/jpeg','image/png','image/webp'].includes(f.type)&&f.size<=5*1024*1024;
export const donationPaise=v=>{const n=Math.round(Number(v)*100);return Number.isInteger(n)&&n>=10000?n:0};
export const safePath=(bucket,file)=>`${bucket}/${crypto.randomUUID()}.${({"image/jpeg":"jpg","image/png":"png","image/webp":"webp"})[file.type]||'bin'}`;
