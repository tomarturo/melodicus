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
// The page before this one, for video_open's from_page.
let currentPage: string | null = null;
let previousPage: string | null = null;

/** Where saved loops live: in this browser, or in an account. */
export type Storage = 'guest' | 'account';

/**
 * Every event the app sends, with its parameters. GA4's recommended names
 * (sign_up, login, search, share) keep their standard meaning.
 */
export type AnalyticsEvent =
  | { name: 'sign_up'; params: { method: 'email_code' } }
  | { name: 'login'; params: { method: 'email_code' } }
  | { name: 'logout'; params?: undefined }
  | { name: 'account_delete'; params?: undefined }
  // search_term goes through searchTermForAnalytics first.
  | { name: 'search'; params: { search_term: string; result_count: number } }
  | { name: 'video_open'; params: { video_id: string; video_title: string; from_page: string; from_share_link: boolean } }
  | { name: 'loop_create'; params: { storage: Storage; duration_s: number; named: boolean } }
  | { name: 'loop_rename'; params: { storage: Storage } }
  | { name: 'loop_retime'; params: { storage: Storage } }
  | { name: 'loop_delete'; params: { storage: Storage } }
  | { name: 'loop_delete_undo'; params: { storage: Storage } }
  | { name: 'loop_play'; params?: undefined }
  | { name: 'playback_rate_change'; params: { rate: number } }
  | { name: 'share'; params: { method: 'link'; content_type: 'song'; loop_count: number } }
  // Loops from a share link saved to My songs (Save song, or changing one of them).
  | { name: 'share_import'; params: { storage: Storage; loop_count: number } }
  | { name: 'song_delete'; params: { storage: Storage } }
  | { name: 'guest_loops_synced'; params: { added: number; failed: number } };

export const storageOf = (kind: 'local' | 'remote'): Storage => (kind === 'local' ? 'guest' : 'account');

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
 * so it's replaced: the search event carries the term, filtered. The query string and hash never get here: share links
 * keep their loops in them.
 */
export function analyticsPath(pathname: string): string {
  return pathname.startsWith('/search/') ? '/search/:query' : pathname;
}

// GA cuts event parameter values off at 100 characters.
const MAX_PARAM_LENGTH = 100;
export const SEARCH_TERM_NOT_RECORDED = '(not recorded)';

// What might identify someone rather than a song: an email address, a link or
// a domain, or a long run of digits like a phone number.
const LOOKS_PERSONAL = [
  /@/,
  /https?:|www\./i,
  /\b[a-z0-9-]+\.(com|net|org|io|co|me|app|xyz|be|ly)\b/i,
  /\d[\d\s().-]{6,}\d/,
];

/**
 * A search as GA records it: lowercased, with spaces tidied, so the same
 * search counts as one. Anything that might identify someone is replaced with
 * "(not recorded)", since GA's terms forbid personal data and its values can't
 * be deleted one by one.
 */
export function searchTermForAnalytics(query: string): string {
  const term = query.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!term || LOOKS_PERSONAL.some((pattern) => pattern.test(term))) return SEARCH_TERM_NOT_RECORDED;
  return term.slice(0, MAX_PARAM_LENGTH);
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
  previousPage = currentPage;
  currentPage = pageName(pathname);
  const fields = pageFields(pathname);
  gtag('set', fields);
  gtag('event', 'page_view', fields);
}

type EventName = AnalyticsEvent['name'];
type ParamsOf<N extends EventName> = Extract<AnalyticsEvent, { name: N }>['params'];

/** Sends one of the app's events. Its parameters are required when it has any. */
export function track<N extends EventName>(name: N, ...params: undefined extends ParamsOf<N> ? [] : [ParamsOf<N>]): void {
  gtag('event', name, params[0] ?? {});
}

/** The page someone came from, or 'direct' when this is the first page of the visit. */
export const pageBefore = (): string => previousPage ?? 'direct';

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
  currentPage = null;
  previousPage = null;
}
