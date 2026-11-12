import React, {useEffect, useRef, useState} from 'react';
import {socialLinks, whatsappUrl} from './lib/organization-links';
import './public-social.css';

const marks = {
  facebook: <path d="M14 21v-8h2.8l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H8v3h2.6v8z"/>,
  instagram: <g fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.7" r=".7" fill="currentColor" stroke="none"/></g>,
  youtube: <path fillRule="evenodd" d="M21.5 7.2a2.7 2.7 0 0 0-1.9-1.9C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.5 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.7 2.7 0 0 0 1.9-1.9c.5-1.7.5-4.8.5-4.8s0-3.1-.5-4.8ZM10 15.3 15.4 12 10 8.7z"/>,
  linkedin: <path d="M4 9h3.5v11H4zm1.8-5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM10 9h3.3v1.5h.1A3.6 3.6 0 0 1 16.7 9c3.5 0 4.1 2.1 4.1 4.8V20h-3.5v-5.5c0-1.3 0-2.7-1.8-2.7s-2 1.4-2 2.6V20H10z"/>,
  threads: <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M19.7 8C18.8 4.6 16.2 3 12 3c-5.5 0-8 3.4-8 9s2.6 9 8 9c4.5 0 7.2-2.2 7.2-5.2 0-3.2-2.7-4.9-6.3-4.9-2.8 0-4.2 1.1-4.2 2.7 0 1.4 1.2 2.3 2.7 2.3 3.3 0 4.4-2.6 4.4-5.2 0-2.8-1.4-4.3-3.7-4.3-1.6 0-2.6.7-3.3 1.7"/>,
  x: <path d="M17.8 3h3L14 10.7 22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.2-8.3L2 3h6.5l4.4 5.9L17.8 3Zm-1 16.2h1.7L7.6 4.7H5.8z"/>,
  chat: <><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 7.6c-.6 0-1.5.8-1.5 2 0 2.5 3.1 5.7 5.8 6.6 1.4.5 2.9-.3 3-1.5l.1-.7-2.6-1.3-.9 1c-1.3-.5-2.5-1.6-3-2.8l.8-.9-1-2.4z"/></>
};

function SocialIcon({name}) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">{marks[name]}</svg>;
}

export function FooterSocialLinks({organization}) {
  const links = socialLinks(organization, {whatsapp: true});
  const list = useRef(null);
  const [entered, setEntered] = useState(false);
  const hasLinks = links.length > 0;
  useEffect(() => {
    if (!hasLinks || entered || !window.IntersectionObserver ||
        !window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered(true);
        observer.disconnect();
      }
    });
    observer.observe(list.current);
    return () => observer.disconnect();
  }, [hasLinks, entered]);
  if (!hasLinks) return null;
  return <ul ref={list} className="public-social-links" aria-label="Social media" data-entered={entered}>
    {links.map(([key, label, url], index) => <li key={key} style={{'--social-delay': `${index * 45}ms`}}>
      <a href={url} aria-label={label} target="_blank" rel="noopener noreferrer">
        <SocialIcon name={key}/><span aria-hidden="true">{label}</span>
      </a>
    </li>)}
  </ul>;
}

export function FloatingWhatsApp({number, menuOpen}) {
  const href = whatsappUrl(number);
  const position = useRef(null);
  const [obstructed, setObstructed] = useState(false);
  useEffect(() => {
    if (!href || menuOpen || !window.IntersectionObserver) return;
    const anchor = position.current;
    const layout = anchor.closest('.public-view');
    const interactive = 'main :is(a,button,input,select,textarea,summary,[role="button"],[role="alert"]), footer, [data-cookie-notice]';
    let observer;
    function observe() {
      observer?.disconnect();
      const {top, right, bottom, left} = anchor.getBoundingClientRect();
      const inset = distance => Math.max(0, Math.floor(distance - 4));
      const margins = [top, window.innerWidth - right, window.innerHeight - bottom, left];
      const overlapping = new Set();
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) overlapping.add(entry.target);
          else overlapping.delete(entry.target);
        }
        setObstructed(overlapping.size > 0);
      }, {rootMargin: margins.map(value => `-${inset(value)}px`).join(' ')});
      layout.querySelectorAll(interactive).forEach(element => observer.observe(element));
    }
    const updates = new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1))) observe();
    });
    observe();
    updates.observe(layout, {childList: true, subtree: true});
    window.addEventListener('resize', observe);
    return () => {
      observer?.disconnect();
      updates.disconnect();
      window.removeEventListener('resize', observe);
    };
  }, [href, menuOpen]);
  if (!href) return null;
  return <div className="public-whatsapp-position" ref={position} data-obstructed={obstructed} data-menu-open={menuOpen}>
    <a className="public-whatsapp-float" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with Sampark on WhatsApp">
      <SocialIcon name="chat"/>
    </a>
  </div>;
}
