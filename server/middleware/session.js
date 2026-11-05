import crypto from 'node:crypto';
export const tokenHash=token=>crypto.createHash('sha256').update(token).digest('hex');
export const sameToken=(token,hash)=>typeof hash==='string'&&hash.length===64&&crypto.timingSafeEqual(Buffer.from(tokenHash(token)),Buffer.from(hash));
