import React, {useEffect, useRef} from 'react';
import {Link} from 'react-router-dom';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {googleReviewUrl} from './lib/site-settings';
import {publicImageUrl} from './lib/api';
import './homepage.css';

export function HomepagePresentation({children}) {
  const root = useRef(null);

  useEffect(() => {
    const media = gsap.matchMedia(root.current);
    media.add('(prefers-reduced-motion: no-preference)', context => {
      const groups = context.selector('[data-reveal-group]');
      const observer = new IntersectionObserver(entries => {
        for (const {isIntersecting, target} of entries) {
          if (!isIntersecting) continue;
          target.classList.add('sampark-entered');
          observer.unobserve(target);
        }
      }, {threshold: 0.12});
      for (const group of groups) observer.observe(group);
      // Published photos and CMS-controlled sections can arrive after initial render.
      const updates = new MutationObserver(records => {
        for (const record of records) {
          for (const element of record.addedNodes) {
            if (element.nodeType !== 1) continue;
            if (element.matches('[data-reveal-group]')) observer.observe(element);
            for (const group of element.querySelectorAll('[data-reveal-group]')) observer.observe(group);
          }
          for (const element of record.removedNodes) {
            if (element.nodeType !== 1) continue;
            observer.unobserve(element);
            for (const group of element.querySelectorAll('[data-reveal-group]')) observer.unobserve(group);
          }
        }
      });
      updates.observe(root.current, {childList: true, subtree: true});
      return () => { updates.disconnect(); observer.disconnect(); };
    });
    return () => media.revert();
  }, []);
  return <div className="sampark-home" ref={root}>{children}</div>;
}

const impact = [
  ['Meals Served', '◉', 'amber', 1280],
  ['Students Taught', '✎', 'blue', 160],
  ['Trees Planted', '❧', 'green', 240],
  ['Interns Trained', '✦', 'violet', 48]
];

export function Impact({demo = false, entries = []}) {
  const verified = impact.map(([label]) => {
    const matches = entries.filter(entry => entry.label.trim().toLowerCase() === label.toLowerCase());
    if (matches.length !== 1) return null;
    const raw = matches[0].value.trim();
    const value = Number(raw.replaceAll(',', ''));
    const canonical = /^\d+$/.test(raw) || ['en-IN','en-US'].some(locale => value.toLocaleString(locale) === raw);
    return canonical && Number.isSafeInteger(value) && value >= 0 ? value : null;
  });
  const hasVerified = verified.some(value => value !== null);
  const showSamples = demo && !hasVerified;
  const counts = showSamples ? impact.map(([, , , value]) => value) : verified;
  const countKey = counts.join('/');
  const root = useRef(null);
  useEffect(() => {
    if (!root.current.querySelector('[data-count]')) return;
    const motion = gsap.matchMedia(root.current);
    motion.add('(prefers-reduced-motion: no-preference)', context => {
      const touch = window.matchMedia('(any-pointer: coarse)').matches;
      if (touch) gsap.registerPlugin(ScrollTrigger);
      for (const node of context.selector('[data-count]')) {
        const card = node.closest('article');
        const target = Number(node.dataset.count);
        const state = {value: 0};
        const format = new Intl.NumberFormat('en-IN');
        const tween = gsap.to(state, {
          value: target, duration: 1.7, ease: 'power2.out', paused: true,
          onUpdate: () => { node.textContent = format.format(Math.round(state.value)); }
        });
        function replay() {
          node.textContent = '0';
          tween.restart();
        }
        function hover(event) {
          if (event.pointerType !== 'touch') replay();
        }
        function focus() {
          if (card.matches(':focus-visible')) replay();
        }
        card.addEventListener('pointerenter', hover);
        card.addEventListener('focus', focus);
        if (touch) ScrollTrigger.create({trigger: card, start: 'top 92%', once: true, onEnter: replay});
        context.add(() => () => {
          card.removeEventListener('pointerenter', hover);
          card.removeEventListener('focus', focus);
          node.textContent = format.format(target);
        });
      }
    });
    return () => motion.revert();
  }, [countKey]);

  return <section ref={root} className="sampark-section sampark-impact" aria-labelledby="impact-heading">
    <div className="container">
      <h2 id="impact-heading">Our <em>impact.</em></h2>
      {!showSamples && !hasVerified && <p>Impact data being updated</p>}
      <div className="sampark-impact-grid" data-reveal-group>
        {impact.map(([label, icon, tone], index) => <article key={label} className={`sampark-card tone-${tone}`}
          tabIndex={counts[index] === null ? undefined : 0}>
          <span className="sampark-icon" aria-hidden="true">{icon}</span>
          {counts[index] === null ? <strong className="sampark-count" aria-label="Figure unavailable">—</strong> :
            <strong className="sampark-count" key={counts[index]}>
              <span className="visually-hidden">{counts[index].toLocaleString('en-IN')}</span>
              <span aria-hidden="true" data-count={counts[index]}>{counts[index].toLocaleString('en-IN')}</span>
            </strong>}
          <h3>{label}</h3>
          {showSamples && <small>Sample figures</small>}
        </article>)}
      </div>
    </div>
  </section>;
}

const indiaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
});

export function RegistrationBadges({certificates = [], taxCertificates = {}, today = indiaDate.format(new Date())}) {
  const published = (id, title) => certificates.some(record =>
    Number(record.id) === id && title.test(record.title) && record.image_path === `/api/verified-certificates/${id}/image`);
  // These two records were reviewed together: the Darpan profile identifies the
  // trust and the Sub-Registrar certificate carries the matching registration.
  const trust = published(2, /^NGO Registration Certificate$/i) && published(3, /^Registration$/i);
  const tax = (code, title) => {
    const certificate = taxCertificates[code];
    return certificate?.validUntil >= today && published(certificate.id, title);
  };
  const badges = [
    [trust, 'Govt. Registered Trust (Non-Profit)', 'M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10ZM9 12l2 2 4-4'],
    [tax('80g', /\b80G\b/i), '80G — Tax Deduction Eligibility', 'M7 17 17 7M8 8h.01M16 16h.01M12 2l3 2 4 1 1 4 2 3-2 3-1 4-4 1-3 2-3-2-4-1-1-4-2-3 2-3 1-4 4-1Z'],
    [tax('12a', /\b12A(?:B)?\b/i), '12A — Income Tax Registration', 'M14 2H5v20h14V7Zm0 0v5h5M8 14l3 3 5-5']
  ].filter(([visible]) => visible);
  if (!badges.length) return null;
  return <ul className="sampark-registration-badges" aria-label="Published registration information">
    {badges.map(([,label,mark]) => <li key={label}><Link to="/transparency#registration">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={mark}/></svg>
      {label}
    </Link></li>)}
  </ul>;
}

const reviewPlaceholders = [
  'Space for a published testimonial about Sampark’s programmes.',
  'Space for a published testimonial about volunteering.',
  'Space for a published testimonial about community support.'
];

export function CommunityReviews({testimonials = [], reviewUrl}) {
  const sample = testimonials.length === 0;
  const google = googleReviewUrl(reviewUrl);
  return <section className="sampark-section sampark-reviews" aria-labelledby="community-reviews-heading">
    <div className="container">
      <h2 id="community-reviews-heading">What People Say About <em>Our Work</em></h2>
      {sample && <p>Sample testimonials — for layout preview only</p>}
      <div className="sampark-review-grid" data-reveal-group>
        {sample ? reviewPlaceholders.map(text => <article className="sampark-review-card" key={text}>
          <span className="sampark-review-quote" aria-hidden="true">“</span><p>{text}</p>
        </article>) : testimonials.map(({name, quote}, index) => <figure className="sampark-review-card" key={index}>
          <span className="sampark-review-quote" aria-hidden="true">“</span>
          <blockquote>{quote}</blockquote>
          <figcaption><span aria-hidden="true">{Array.from(name.trim())[0].toLocaleUpperCase()}</span>{name}</figcaption>
        </figure>)}
      </div>
      {google && <a className="sampark-pill sampark-review-link" href={google} target="_blank" rel="noopener noreferrer">Read Reviews on Google ↗</a>}
    </div>
  </section>;
}

const allocations = [
  ['Programme delivery', 'Materials and direct programme costs', 'green', 60],
  ['Operations', 'Logistics and administration', 'blue', 20],
  ['Outreach', 'Community engagement', 'amber', 12],
  ['Reserve', 'Contingencies', 'violet', 8]
];

export function Giving({demo = import.meta.env.DEV}) {
  const root = useRef(null);
  useEffect(() => {
    if (!demo) return;
    gsap.registerPlugin(ScrollTrigger);
    const motion = gsap.matchMedia(root.current);
    motion.add('(prefers-reduced-motion: no-preference)', context => {
      const segments = context.selector('[data-allocation]');
      if (segments.length) {
        gsap.from(segments, {
          scaleX: 0, duration: 0.65, stagger: 0.07, ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {trigger: segments[0].parentElement, start: 'top 92%', once: true}
        });
      }
    });
    return () => motion.revert();
  }, [demo]);

  return <section ref={root} className="sampark-section sampark-giving" aria-labelledby="giving-heading">
    <div className="container sampark-split">
      <div>
        <p className="eyebrow">DONATION TRANSPARENCY</p>
        <h2 id="giving-heading">Where your <em>donation goes.</em></h2>
        <p>Find published registration records and reporting updates on our transparency page.</p>
        <Link className="text-link" to="/transparency">Registration and transparency ↗</Link>
      </div>
      <div className="sampark-allocation">
        <h3>Donation allocation</h3>
        {demo ? <>
          <p>DEMO · Illustrative allocation only.</p>
          <div className="sampark-allocation-bar" aria-hidden="true">
            {allocations.map(([label, , tone, share]) => <span key={label} data-allocation className={`tone-${tone}`} style={{flexGrow: share}}/>)}
          </div>
          <ul>
            {allocations.map(([label, description, tone, share]) => <li key={label} className={`tone-${tone}`}>
              <strong>{share}% {label}</strong><small>{description}</small>
            </li>)}
          </ul>
        </> : <p>Verified allocation figures will appear when supporting records are available.</p>}
      </div>
    </div>
  </section>;
}

export function Campaigns() {
  return <section className="sampark-section sampark-campaigns" aria-labelledby="campaign-heading">
    <div className="container">
      <h2 id="campaign-heading">Ways to <em>get involved.</em></h2>
      <div className="sampark-campaign-grid" data-reveal-group>
        <article className="sampark-card tone-amber">
          <span className="sampark-icon" aria-hidden="true">◉</span>
          <h3>Strike Off Hunger</h3>
          <p>Ask about sponsoring meals for a birthday, anniversary, in memory of someone, or another special day.</p>
          <div className="sampark-media-note">Campaign video pending publication</div>
          <Link className="text-link" to="/contact">Ask about meal sponsorship ↗</Link>
        </article>
        <article className="sampark-card tone-blue">
          <span className="sampark-icon" aria-hidden="true">✎</span>
          <h3>Modern Pathshala</h3>
          <p>Explore education and practical skill development. Contact the academy for current locations and participation details.</p>
          <Link className="text-link" to="/programs">Explore programmes ↗</Link>
          <Link className="text-link" to="/sponsor">Sponsor a Child ↗</Link>
        </article>
        <article className="sampark-card tone-green">
          <span className="sampark-icon" aria-hidden="true">❧</span>
          <h3>Have a Green Heart</h3>
          <p>Ask about tree planting and donating used clothes. Contact the academy before bringing any medicines so staff can check whether they can be accepted.</p>
          <Link className="text-link" to="/volunteer">Volunteer ↗</Link>
          <Link className="text-link" to="/contact">Contact the academy ↗</Link>
        </article>
      </div>
    </div>
  </section>;
}

export function PhotoMoments({photos = []}) {
  const published = photos.filter(photo => photo.image_path).slice(0, 4);
  return <section className="sampark-section sampark-photos" aria-labelledby="moments-heading">
    <div className="container">
      <h2 id="moments-heading">Moments that <em>bring us together.</em></h2>
      {published.length > 0 && <div className="sampark-photo-grid" data-reveal-group>
        {published.map(photo => <figure key={photo.id}>
          <img src={publicImageUrl(photo.image_path)} alt="" width="480" height="360" loading="lazy" decoding="async"/>
          <figcaption>{photo.title}</figcaption>
        </figure>)}
      </div>}
      <Link className="sampark-pill" to="/gallery">Visit the gallery ↗</Link>
    </div>
  </section>;
}

export function Support() {
  return <section className="sampark-section sampark-support" aria-labelledby="support-heading">
    <div className="container sampark-split">
      <div><h2 id="support-heading">Help someone take <em>the next step.</em></h2></div>
      <div>
        <p>Find approved giving instructions or speak to the academy about supporting its work.</p>
        <div className="sampark-actions">
          <Link className="sampark-pill" to="/donate">Donation information ↗</Link>
          <Link className="sampark-pill sampark-secondary" to="/contact">Contact us ↗</Link>
        </div>
      </div>
    </div>
  </section>;
}
