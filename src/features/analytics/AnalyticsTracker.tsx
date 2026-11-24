import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { identify, trackPageView } from '../../lib/analytics';

/**
 * Tells Google Analytics who's signed in and which page is showing. Renders
 * inside AuthProvider, which waits for the session, so the first page view
 * already knows whether someone is signed in.
 */
const AnalyticsTracker = () => {
  const userId = useAuth().user?.id ?? null;
  const { pathname } = useLocation();

  // Declared first, so it runs before the page view on the first render.
  useEffect(() => identify(userId), [userId]);

  // Only the path: the query string and hash can hold shared loops.
  useEffect(() => trackPageView(pathname), [pathname]);

  return null;
};

export default AnalyticsTracker;
