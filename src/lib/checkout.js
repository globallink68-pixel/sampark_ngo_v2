import{donationPaise}from'./validation';


export const validateDonation=donor=>{const amount=donationPaise(donor.amount);if(!donor.name?.trim()||!/^\S+@\S+\.\S+$/.test(donor.email)||!donor.mobile?.trim()||!amount)throw Error('Enter valid donor details and an amount of at least ₹100.');return{...donor,amount:amount/100}};
const retired=()=>Promise.reject(Object.assign(Error('Online payment operations are retired.'),{status:410}));
export const loadRazorpay=retired;
export const startCheckout=retired;
