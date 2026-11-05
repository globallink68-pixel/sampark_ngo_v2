import{afterEach,describe,it,expect,vi}from'vitest';
import{readFileSync}from'node:fs';
import{PublicApiError,apiUrl,publicRequest}from'../src/lib/api.js';
import{loadRazorpay,startCheckout}from'../src/lib/checkout.js';

const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
const donor={name:'Donor',email:'donor@example.org',mobile:'9999999999',amount:'500'};
const originalWindow=globalThis.window,originalDocument=globalThis.document;
afterEach(()=>{globalThis.window=originalWindow;globalThis.document=originalDocument});

describe('H4 public Contact and payment flows',()=>{
  it('posts Contact details, honeypot, and the public Turnstile token to Express',async()=>{const fetcher=vi.fn().mockResolvedValue({ok:true,status:201});await expect(publicRequest('/api/contact',{method:'POST',body:{name:'A',email:'a@example.org',mobile:'1',subject:'Hello',message:'Message',website:'',turnstile_token:'turnstile-token'},fetcher,base:''})).resolves.toBeNull();expect(fetcher).toHaveBeenCalledWith('/api/contact',expect.objectContaining({method:'POST',credentials:'same-origin',body:JSON.stringify({name:'A',email:'a@example.org',mobile:'1',subject:'Hello',message:'Message',website:'',turnstile_token:'turnstile-token'})}))});
  it('handles Contact validation, rate-limit, and network failures safely',async()=>{for(const status of [400,429,500])await expect(publicRequest('/api/contact',{method:'POST',body:{},fetcher:vi.fn().mockResolvedValue(response({},status))})).rejects.toMatchObject({status});await expect(publicRequest('/api/contact',{fetcher:vi.fn().mockRejectedValue(Error('network details'))})).rejects.toBeInstanceOf(PublicApiError)});
  it('supports configured and same-origin payment API URLs',()=>{expect(apiUrl('/api/donations/create-order','')).toBe('/api/donations/create-order');expect(apiUrl('/api/donations/verify-payment','https://api.example.org/')).toBe('https://api.example.org/api/donations/verify-payment')});
  it('keeps a JSON server-created order returned with HTTP 201',async()=>{const order={id:'order_1',amount:50000,currency:'INR'};await expect(publicRequest('/api/donations/create-order',{method:'POST',body:donor,fetcher:vi.fn().mockResolvedValue(response(order,201))})).resolves.toEqual(order)});
  it('does not load checkout scripts or make provider requests',async()=>{const fetcher=vi.fn();await expect(startCheckout({request:fetcher})).rejects.toMatchObject({status:410});await expect(loadRazorpay()).rejects.toMatchObject({status:410});expect(fetcher).not.toHaveBeenCalled()});
  it('contains no retired backend-client or webhook calls in Contact and checkout paths',()=>{const main=readFileSync('src/main.jsx','utf8'),checkout=readFileSync('src/lib/checkout.js','utf8');expect(main).not.toMatch(/functions\.invoke/i);expect(checkout).not.toMatch(/functions\.invoke|webhooks\/razorpay/i)});
  it('references only public browser configuration keys',()=>{const frontend=[readFileSync('src/main.jsx','utf8'),readFileSync('src/lib/checkout.js','utf8')].join('\n');expect(frontend).not.toMatch(/RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|TURNSTILE_SECRET_KEY|VITE_.*SECRET/)});
});
