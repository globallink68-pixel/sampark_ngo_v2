// @vitest-environment jsdom
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it} from 'vitest';
import {Campaigns, CommunityReviews, Giving, Impact, PhotoMoments, RegistrationBadges} from '../src/homepage-sections';
import {parseSiteSettings} from '../src/lib/site-settings';

function render(element) {
  return renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
}

describe('homepage publication boundaries', () => {
  it('shows all four impact categories without numerical claims in production', () => {
    const html = render(<Impact demo={false}/>);
    for (const label of ['Meals Served', 'Students Taught', 'Trees Planted', 'Interns Trained']) {
      expect(html).toContain(label);
    }
    expect(html).toContain('Impact data being updated');
    expect(html).not.toContain('data-count=');
  });

  it('labels demonstration figures and preserves the final accessible values', () => {
    const html = render(<Impact demo/>);
    expect(html).toContain('Demo animation — sample figures, not actual NGO impact');
    expect(html.match(/data-count=/g)).toHaveLength(4);
    expect(html).toContain('1,280');
  });

  it('renders noninteractive footer badges only for published and current certificates', () => {
    const certificates = [[2,'NGO Registration Certificate'],[3,'Registration'],[5,'80G Certificate'],[6,'12AB Certificate']]
      .map(([id,title])=>({id,title,image_path:`/api/verified-certificates/${id}/image`}));
    const taxCertificates = {'80g':{id:5,validUntil:'2027-01-01'},'12a':{id:6,validUntil:'2027-01-01'}};
    const html = render(<RegistrationBadges footer certificates={certificates} taxCertificates={taxCertificates} today="2026-11-12"/>);
    expect(html).toContain('Govt Registration Trust (Non profit)');
    expect(html).toContain('80G — Tax Deduction Eligibility');
    expect(html).toContain('12A Registration');
    expect(html).not.toMatch(/<a\s|<button|50%/);
    const trustOnly = render(<RegistrationBadges footer certificates={certificates.slice(0,2)} taxCertificates={taxCertificates} today="2026-11-12"/>);
    expect(trustOnly).toContain('Govt Registration Trust (Non profit)');
    expect(trustOnly).not.toMatch(/80G|12A/);
  });

  it('requires both reviewed trust records and a published, current certificate for a tax badge', () => {
    const certificate = (id, title) => ({id, title, image_path: `/api/verified-certificates/${id}/image`});
    const certificates = [certificate(2,'NGO Registration Certificate'), certificate(3,'Registration'), certificate(5,'80G Certificate')];
    expect(render(<RegistrationBadges certificates={certificates.slice(0,1)}/>)).toBe('');
    const html = render(<RegistrationBadges certificates={certificates} today="2026-11-12" taxCertificates={{
      '80g':{id:5,validUntil:'2026-11-12'}, '12a':{id:6,validUntil:'2026-11-11'}
    }}/>);
    expect(html).toContain('Govt. Registered Trust');
    expect(html).toContain('80G — Tax Deduction Eligibility');
    expect(html).not.toContain('12A');
    expect(render(<RegistrationBadges certificates={certificates} today="2026-11-13"
      taxCertificates={{'80g':{id:5,validUntil:'2026-11-12'}}}/>)).not.toContain('80G');
  });

  it('labels sample review cards and renders published testimonials as text with a validated Google URL', () => {
    const sample = render(<CommunityReviews reviewUrl="https://www.google.com.evil/maps/place/fixture"/>);
    expect(sample).toContain('Sample testimonials — for layout preview only');
    expect(sample.match(/sampark-review-card/g)).toHaveLength(3);
    expect(sample).not.toContain('Read Reviews on Google');
    const googleReviewsUrl = 'https://www.google.com/maps/place/Fixture/';
    const settings = parseSiteSettings(JSON.stringify({
      testimonials:[{name:'Approved reviewer', quote:'<img src=x>'}],googleReviewsUrl
    }));
    const html = render(<CommunityReviews testimonials={settings.testimonials} reviewUrl={settings.googleReviewsUrl}/>);
    expect(html).toContain('&lt;img src=x&gt;');
    expect(html).toContain('Approved reviewer');
    expect(html).toContain(`href="${googleReviewsUrl}"`);
    expect(html).not.toContain('Sample testimonials');
    expect(parseSiteSettings(JSON.stringify({googleReviewsUrl:'javascript:alert(1)'}))).toBeNull();
    expect(parseSiteSettings(JSON.stringify({googleReviewsUrl:'https://www.google.com/maps/place/../../url'}))).toBeNull();
  });

  it('uses only supported numeric values from published CMS impact entries', () => {
    const html = render(<Impact demo entries={[
      {label: 'Meals Served', value: '12,345'},
      {label: 'Students Taught', value: '0'},
      {label: 'Trees Planted', value: '100+'},
      {label: 'Interns Trained', value: '1,2'}
    ]}/>);
    expect(html).toContain('data-count="12345"');
    expect(html).toContain('data-count="0"');
    expect(html.match(/data-count=/g)).toHaveLength(2);
    expect(html).not.toContain('Demo animation');
  });

  it('keeps the allocation bar out of production and labels the development preview', () => {
    expect(render(<Giving demo={false}/>)).not.toContain('data-allocation');
    expect(render(<Giving demo/>)).toContain('DEMO');
    expect(render(<Giving demo/>).match(/data-allocation/g)).toHaveLength(4);
  });

  it('uses existing enquiry, sponsorship and volunteer paths', () => {
    const html = render(<Campaigns/>);
    for (const route of ['/contact', '/sponsor', '/programs', '/volunteer']) {
      expect(html).toContain(`href="${route}"`);
    }
  });

  it('shows only published gallery photos and links to the existing gallery', () => {
    expect(render(<PhotoMoments/>)).not.toContain('<img');
    const html = render(<PhotoMoments photos={[{id: 1, title: 'Classroom', image_path: '/class.webp'}]}/>);
    expect(html).toContain('src="/class.webp"');
    expect(html).toContain('href="/gallery"');
  });
});
