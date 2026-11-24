import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NewSection } from '../sections/types';
import { decodeSharedLoops } from './shareFormat';

/**
 * Loops shared through the current URL, read once when the video page opens.
 * The page shows them straight away, unsaved, until the song is saved (Save
 * song, or the first change to its loops); dismiss() then drops them in favour
 * of the saved copies. The share data is removed from the address bar, so a
 * reload or a bookmark doesn't bring them back.
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
