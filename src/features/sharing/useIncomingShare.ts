import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NewSection } from '../sections/types';
import { decodeSharedLoops } from './shareFormat';

/**
 * Loops shared through the current URL, read once when the video page opens.
 * The share data is then removed from the address bar, so a reload or a
 * bookmark doesn't offer the same import again.
 */
export function useIncomingShare() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loops, setLoops] = useState<NewSection[] | null>(() => {
    const decoded = decodeSharedLoops(location);
    return decoded && decoded.length > 0 ? decoded : null;
  });

  const hasShareData = location.hash.startsWith('#v1=') || new URLSearchParams(location.search).has('sections');
  useEffect(() => {
    if (hasShareData) navigate(location.pathname, { replace: true });
  }, [hasShareData, location.pathname, navigate]);

  return { loops, dismiss: () => setLoops(null) };
}
