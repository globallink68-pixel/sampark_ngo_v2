// @vitest-environment jsdom
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it} from 'vitest';
import {Campaigns, Giving, Impact, PhotoMoments} from '../src/homepage-sections';

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
    expect(html).toContain('DEMO');
    expect(html.match(/data-count=/g)).toHaveLength(4);
    expect(html).toContain('1,280');
  });

  it('uses only supported numeric values from published CMS impact entries', () => {
    const html = render(<Impact entries={[
      {label: 'Meals Served', value: '12,345'},
      {label: 'Students Taught', value: '0'},
      {label: 'Trees Planted', value: '100+'},
      {label: 'Interns Trained', value: '1,2'}
    ]}/>);
    expect(html).toContain('data-count="12345"');
    expect(html).toContain('data-count="0"');
    expect(html.match(/data-count=/g)).toHaveLength(2);
    expect(html).not.toContain('DEMO');
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
