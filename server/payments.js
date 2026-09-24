import crypto from'node:crypto';

export const donationPaise=value=>{
  const text=String(value??'').trim();
  if(!/^\d+(?:\.\d{1,2})?$/.test(text))return null;
  const[whole,fraction='']=text.split('.');
  const paise=Number(whole)*100+Number((fraction+'00').slice(0,2));
  return Number.isSafeInteger(paise)&&paise>=10000?paise:null;
};

export const safeEqual=(left,right)=>{
  const a=Buffer.from(String(left||'')),b=Buffer.from(String(right||''));
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
};

export const hmac=(secret,value)=>crypto.createHmac('sha256',secret||'').update(value).digest('hex');
export const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
export const validDonor=donor=>Boolean(donor?.name?.trim()&&/^\S+@\S+\.\S+$/.test(donor.email||'')&&donor?.mobile?.trim());
