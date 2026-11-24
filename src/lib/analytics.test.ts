import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  COOKIE_FREE_REGIONS,
  analyticsPath,
  identify,
  initAnalytics,
  pageName,
  resetAnalyticsForTests,
  trackPageView,
} from './analytics';

/** Everything queued for gtag.js, as plain arrays. */
const commands = () => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
const gtagScripts = () => document.head.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');

beforeEach(() => {
  resetAnalyticsForTests();
  delete window.dataLayer;
  delete window.gtag;
  gtagScripts().forEach((script) => script.remove());
});

afterEach(() => resetAnalyticsForTests());

describe('without a measurement ID', () => {
  it('loads nothing and sends nothing', () => {
    initAnalytics(null);
    trackPageView('/');
    identify('user-1');
    expect(window.dataLayer).toBeUndefined();
    expect(gtagScripts()).toHaveLength(0);
  });
});

describe('with a measurement ID', () => {
  it('loads gtag.js for that ID', () => {
    initAnalytics('G-TEST123');
    expect(gtagScripts()).toHaveLength(1);
    expect(gtagScripts()[0].getAttribute('src')).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST123');
  });

  it('sets the consent defaults before configuring GA', () => {
    initAnalytics('G-TEST123');
    const [regional, global, , config] = commands();

    expect(regional).toEqual([
      'consent',
      'default',
      expect.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied', region: COOKIE_FREE_REGIONS }),
    ]);
    expect(global).toEqual(['consent', 'default', expect.objectContaining({ analytics_storage: 'granted', ad_storage: 'denied' })]);
    expect(global[2]).not.toHaveProperty('region');
    expect(config).toEqual(['config', 'G-TEST123', expect.objectContaining({ send_page_view: false })]);
  });

  it('turns cookies off across the EU, EEA, UK and Switzerland', () => {
    expect(COOKIE_FREE_REGIONS).toHaveLength(32);
    expect(COOKIE_FREE_REGIONS).toEqual(expect.arrayContaining(['DE', 'FR', 'IE', 'NO', 'IS', 'LI', 'GB', 'CH']));
    expect(COOKIE_FREE_REGIONS).not.toContain('US');
  });

  it('only loads once', () => {
    initAnalytics('G-TEST123');
    initAnalytics('G-TEST123');
    expect(gtagScripts()).toHaveLength(1);
  });

  it('sends page views with the path only, never the query string or hash', () => {
    window.history.replaceState(null, '', '/video/abc?loops=1-2#l=secret');
    initAnalytics('G-TEST123');
    trackPageView('/video/abc');

    const sent = JSON.stringify(commands());
    expect(sent).not.toContain('secret');
    expect(sent).not.toContain('loops=');
    expect(commands().at(-1)).toEqual([
      'event',
      'page_view',
      { page_location: `${window.location.origin}/video/abc`, page_title: 'video' },
    ]);
    window.history.replaceState(null, '', '/');
  });

  it('sets the page for later events too', () => {
    initAnalytics('G-TEST123');
    trackPageView('/saved-songs');
    expect(commands().at(-2)).toEqual(['set', { page_location: `${window.location.origin}/saved-songs`, page_title: 'saved_songs' }]);
  });

  it('keeps search terms out of page views', () => {
    initAnalytics('G-TEST123');
    trackPageView('/search/little%20wing');
    expect(JSON.stringify(commands())).not.toContain('wing');
    expect(commands().at(-1)?.[2]).toMatchObject({ page_location: `${window.location.origin}/search/:query`, page_title: 'search' });
  });

  it('sets and clears the user ID', () => {
    initAnalytics('G-TEST123');
    identify('user-1');
    expect(commands().slice(-2)).toEqual([
      ['set', { user_id: 'user-1' }],
      ['set', 'user_properties', { signed_in: 'yes' }],
    ]);
    identify(null);
    expect(commands().slice(-2)).toEqual([
      ['set', { user_id: null }],
      ['set', 'user_properties', { signed_in: 'no' }],
    ]);
  });
});

describe('pageName', () => {
  it.each([
    ['/', 'home'],
    ['/video/abc123', 'video'],
    ['/video/null', 'video_not_found'],
    ['/search/anything', 'search'],
    ['/saved-songs', 'saved_songs'],
    ['/account', 'account'],
    ['/privacy', 'privacy'],
    ['/nope', 'not_found'],
  ])('%s is %s', (path, name) => expect(pageName(path)).toBe(name));
});

describe('analyticsPath', () => {
  it('leaves other paths alone', () => {
    expect(analyticsPath('/video/abc123')).toBe('/video/abc123');
    expect(analyticsPath('/')).toBe('/');
  });
});
