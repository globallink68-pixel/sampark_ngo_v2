// @vitest-environment jsdom
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {Impact} from '../src/homepage-sections';
import {FloatingWhatsApp, FooterSocialLinks} from '../src/public-social';

vi.mock('gsap', () => ({gsap: {registerPlugin: vi.fn(), matchMedia: vi.fn(), to: vi.fn()}}));
vi.mock('gsap/ScrollTrigger', () => ({ScrollTrigger: {create: vi.fn()}}));

let host, root, revert, play;
function setupMotion(matches = true) {
  const cleanups = [];
  revert = vi.fn(() => cleanups.forEach(cleanup => cleanup()));
  play = vi.fn();
  gsap.to.mockReturnValue({play});
  gsap.matchMedia.mockImplementation(scope => ({
    revert,
    add(query, setup) {
      expect(query).toBe('(prefers-reduced-motion: no-preference)');
      if (matches) setup({
        selector: selector => scope.querySelectorAll(selector),
        add: register => cleanups.push(register())
      });
    }
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

it('renders the floating icon only for a valid published WhatsApp number', () => {
  expect(renderToStaticMarkup(<FloatingWhatsApp number="123"/>)).toBe('');
  const markup = renderToStaticMarkup(<FloatingWhatsApp number="+91 98765 43210" menuOpen/>);
  expect(markup).toContain('href="https://wa.me/919876543210"');
  expect(markup).toContain('data-menu-open="true"');
  expect(markup).toContain('rel="noopener noreferrer"');
  expect(markup).toContain('aria-label="Chat with Sampark on WhatsApp"');
  expect(markup).toContain('<svg');
});

it('renders labeled icons only for valid published profiles', () => {
  const markup = renderToStaticMarkup(<FooterSocialLinks organization={{
    instagram_url: 'https://instagram.com/sampark',
    x_url: 'javascript:alert(1)',
    facebook_url: 'https://'
  }}/>);
  expect(markup).toContain('aria-label="Instagram"');
  expect(markup).toContain('rel="noopener noreferrer"');
  expect(markup.match(/<svg/g)).toHaveLength(1);
  expect(markup).not.toMatch(/javascript|Facebook|Twitter/);
});

it('activates four labeled demo counters and reverts them on close', () => {
  setupMotion();
  act(() => root.render(<Impact/>));
  expect(host.querySelectorAll('[data-count]')).toHaveLength(0);
  act(() => host.querySelector('button').click());
  expect(host.textContent).toContain('DEMO · Sample figures');
  expect(host.querySelectorAll('[data-count]')).toHaveLength(4);
  expect(ScrollTrigger.create).toHaveBeenCalledTimes(4);
  act(() => host.querySelector('button').click());
  expect(host.querySelectorAll('[data-count]')).toHaveLength(0);
  expect(revert).toHaveBeenCalledOnce();
});

it('triggers a verified count once and reverts its animation on unmount', () => {
  setupMotion();
  act(() => root.render(<Impact entries={[{label: 'Meals Served', value: '1,234'}]}/>));
  expect(gsap.to).toHaveBeenCalledWith({value: 0}, expect.objectContaining({value: 1234, duration: 1.6}));
  const trigger = ScrollTrigger.create.mock.calls[0][0];
  trigger.onEnter();
  trigger.onEnter();
  expect(trigger.trigger.textContent).toBe('0');
  expect(play).toHaveBeenCalledOnce();
  act(() => root.render(null));
  expect(revert).toHaveBeenCalledOnce();
});

it('displays final demo values without creating triggers in reduced motion', () => {
  setupMotion(false);
  act(() => root.render(<Impact/>));
  act(() => host.querySelector('button').click());
  expect([...host.querySelectorAll('[data-count]')].map(node => node.textContent)).toEqual(['1,280','160','240','48']);
  expect(ScrollTrigger.create).not.toHaveBeenCalled();
});
