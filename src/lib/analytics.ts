import { gaMeasurementId } from './env';

/**
 * Google Analytics, behind a few typed calls. Every call does nothing until
 * initAnalytics has run with a measurement ID, so dev, preview and tests send
 * nothing and need no mocks.
 */

// Visitors here get no analytics cookies, so there's nothing to ask their
// consent for and no banner. GA works out a visitor's region from their IP.
// The EU, then the rest of the EEA, the UK and Switzerland.
export const COOKIE_FREE_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'GB', 'CH',
];

// Melodicus shows no ads, so ad features stay off everywhere.
const ADS_OFF = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

let enabled = false;

const gtag = (...args: unknown[]) => {
  if (enabled) window.gtag?.(...args);
};

/** What a page is, for page_title: the document title is the same on every route. */
export function pageName(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname === '/video/null') return 'video_not_found';
  if (pathname.startsWith('/video/')) return 'video';
  if (pathname.startsWith('/search/')) return 'search';
  if (pathname === '/saved-songs') return 'saved_songs';
  if (pathname === '/account') return 'account';
  if (pathname === '/privacy') return 'privacy';
  return 'not_found';
}

/**
 * The path as GA may see it. The search route's path is what someone typed,
 * so it's replaced. The query string and hash never get here: share links
 * keep their loops in them.
 */
export function analyticsPath(pathname: string): string {
  return pathname.startsWith('/search/') ? '/search/:query' : pathname;
}

const pageFields = (pathname: string) => ({
  page_location: window.location.origin + analyticsPath(pathname),
  page_title: pageName(pathname),
});

/**
 * Loads GA with the consent defaults set first. Page views are sent by
 * trackPageView, not by GA itself, which can't see route changes.
 */
export function initAnalytics(measurementId: string | null = gaMeasurementId): void {
  if (!measurementId || enabled) return;
  enabled = true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag.js reads the arguments object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };

  // A region's defaults take precedence over the global ones.
  gtag('consent', 'default', { ...ADS_OFF, analytics_storage: 'denied', region: COOKIE_FREE_REGIONS });
  gtag('consent', 'default', { ...ADS_OFF, analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...pageFields(window.location.pathname),
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

/** Sends a page view, and makes this page the one later events belong to. */
export function trackPageView(pathname: string): void {
  const fields = pageFields(pathname);
  gtag('set', fields);
  gtag('event', 'page_view', fields);
}

/**
 * Links a signed-in person's visits across devices by their Supabase user ID,
 * a random UUID rather than anything about them. null clears it on log out.
 */
export function identify(userId: string | null): void {
  gtag('set', { user_id: userId });
  gtag('set', 'user_properties', { signed_in: userId ? 'yes' : 'no' });
}

/** For tests: forget that initAnalytics ran. */
export function resetAnalyticsForTests(): void {
  enabled = false;
}
