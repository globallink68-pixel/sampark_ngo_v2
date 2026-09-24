import{donationPaise}from'./validation';
import{publicRequest}from'./api';

export const validateDonation=donor=>{const amount=donationPaise(donor.amount);if(!donor.name?.trim()||!/^\S+@\S+\.\S+$/.test(donor.email)||!donor.mobile?.trim()||!amount)throw Error('Enter valid donor details and an amount of at least ₹100.');return{...donor,amount:amount/100}};
let checkoutScript;
export const loadRazorpay=()=>{
  if(window.Razorpay)return Promise.resolve(window.Razorpay);
  if(checkoutScript)return checkoutScript;
  checkoutScript=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;script.onload=()=>window.Razorpay?resolve(window.Razorpay):reject(Error('Payment checkout unavailable.'));script.onerror=()=>reject(Error('Could not load payment checkout.'));document.head.appendChild(script)});
  return checkoutScript.catch(error=>{checkoutScript=null;throw error});
};

export async function startCheckout({donor,onState,request=publicRequest,load=loadRazorpay,key=import.meta.env.VITE_RAZORPAY_KEY_ID}){
  const payload=validateDonation(donor);
  onState('creating_order');
  const order=await request('/api/donations/create-order',{method:'POST',body:payload});
  if(!order?.id||!Number.isInteger(order.amount)||!order.currency)throw Error('Could not create payment order.');
  const Razorpay=await load();
  onState('checkout_open');
  return new Promise((resolve,reject)=>{
    const checkout=new Razorpay({key,order_id:order.id,amount:order.amount,currency:order.currency,name:'Sam Park Academy',prefill:{name:payload.name,email:payload.email,contact:payload.mobile},handler:async response=>{try{onState('verifying');await request('/api/donations/verify-payment',{method:'POST',body:{razorpay_order_id:response.razorpay_order_id,razorpay_payment_id:response.razorpay_payment_id,razorpay_signature:response.razorpay_signature}});onState('success');resolve()}catch{onState('failed');reject(Error('Payment verification failed.'))}},modal:{ondismiss:()=>{onState('cancelled');reject(Error('Payment cancelled.'))}}});
    checkout.on('payment.failed',()=>{onState('failed');reject(Error('Payment failed.'))});
    checkout.open();
  });
}
