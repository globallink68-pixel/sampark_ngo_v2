export function formatPaise(value){
 const text=String(value??'0');
 if(!/^-?\d+$/.test(text)||(typeof value==='number'&&!Number.isSafeInteger(value)))return '—';
 const amount=BigInt(text),absolute=amount<0n?-amount:amount;
 return `${amount<0n?'-':''}₹${absolute/100n}.${String(absolute%100n).padStart(2,'0')}`;
}
