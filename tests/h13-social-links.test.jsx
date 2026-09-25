// @vitest-environment jsdom
import{afterEach,describe,it,expect,vi}from'vitest';
import React from'react';
import{createRoot}from'react-dom/client';
import{AdminOrganization}from'../src/admin.jsx';
import{socialLinks}from'../src/lib/organization-links.js';

const profile={organization_name:'Sampark Academy',tagline:'Community and possibility',short_description:'Learning and care.',primary_email:'hello@sampark.example',primary_phone:'+91 9876543210',threads_url:'https://www.threads.net/@sampark',x_url:'https://x.com/sampark'};

afterEach(()=>{vi.unstubAllGlobals();document.body.innerHTML=''});

describe('H13 Threads and X social links',()=>{
  it('keeps null, undefined, blank, and whitespace social values out of public links',()=>{for(const value of[null,undefined,'','   ']){const links=socialLinks({threads_url:value,x_url:value});expect(links).toEqual([]);expect(links.map(([, ,url])=>url)).not.toContain('null');expect(links.map(([, ,url])=>url)).not.toContain('undefined')}});
  it('builds safe Threads and X links with labels and no changed existing values',()=>{const links=socialLinks(profile),byName=Object.fromEntries(links.map(([,name,url])=>[name,url]));expect(byName).toMatchObject({Threads:'https://www.threads.net/@sampark','X (Twitter)':'https://x.com/sampark'});expect(profile.organization_name).toBe('Sampark Academy')});
  it('renders Threads and X social anchors on the public Contact route',async()=>{document.body.innerHTML='<div id="root"></div>';window.history.replaceState({},'', '/contact');vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>profile}));await import('../src/main.jsx');await vi.waitFor(()=>{expect(document.querySelector('a[aria-label="Threads"]')).not.toBeNull();expect(document.querySelector('a[aria-label="X (Twitter)"]')).not.toBeNull()});for(const link of[...document.querySelectorAll('a[aria-label="Threads"],a[aria-label="X (Twitter)"]')]){expect(link.target).toBe('_blank');expect(link.rel).toContain('noopener');expect(link.rel).toContain('noreferrer')}const hrefs=[...document.querySelectorAll('[href]')].map(link=>link.getAttribute('href'));expect(hrefs).not.toContain('null');expect(hrefs).not.toContain('undefined')});
  it('renders both URL inputs in Admin Organization Settings',async()=>{document.body.innerHTML='<div id="root"></div>';vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>profile}));const root=createRoot(document.getElementById('root'));root.render(<AdminOrganization/>);await vi.waitFor(()=>{expect(document.querySelector('input[name="threads_url"]')).not.toBeNull();expect(document.querySelector('input[name="x_url"]')).not.toBeNull()});expect(document.querySelector('input[name="threads_url"]').placeholder).toBe('https://www.threads.net/@username');expect(document.querySelector('input[name="x_url"]').placeholder).toBe('https://x.com/username');root.unmount()});
});
