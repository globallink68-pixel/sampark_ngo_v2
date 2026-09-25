// @vitest-environment jsdom
import{afterEach,describe,it,expect,vi}from'vitest';
import{emailUrl,externalUrl,optionalText,phoneUrl,whatsappUrl}from'../src/lib/organization-links.js';

const nullOrganization={organization_name:'Sampark Academy',tagline:'Community, dignity and possibility.',short_description:'Learning and care.',facebook_url:null,instagram_url:null,youtube_url:null,linkedin_url:null,google_maps_url:null,website_url:null,whatsapp_number:null,primary_email:null,secondary_email:null,primary_phone:null,secondary_phone:null,address:null,city:null,state:null,postal_code:null};

afterEach(()=>{vi.unstubAllGlobals();document.body.innerHTML=''});

describe('H11 optional Organization link data',()=>{
  it('normalizes null, undefined, and empty optional values without creating links',()=>{for(const value of[null,undefined,'']){expect(optionalText(value)).toBe('');expect(externalUrl(value)).toBe('');expect(emailUrl(value)).toBe('');expect(phoneUrl(value)).toBe('');expect(whatsappUrl(value)).toBe('')}});
  it('renders Contact with production-style null Organization URLs and no null hrefs',async()=>{document.body.innerHTML='<div id="root"></div>';window.history.replaceState({},'', '/contact');vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>nullOrganization}));await import('../src/main.jsx');await new Promise(resolve=>setTimeout(resolve,0));const hrefs=[...document.querySelectorAll('[href]')].map(link=>link.getAttribute('href'));expect(document.body.textContent).toContain('Contact us');expect(hrefs).not.toContain('null');expect(hrefs).not.toContain('undefined');expect(document.body.textContent).not.toContain('null')});
});
