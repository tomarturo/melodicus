import useLocalSections from './useLocalSections';
import useSavedSections from './useSavedSections';

const useSections = (videoId, user, videoTitle) => {
  // Always call both hooks (React rules of hooks — no conditional calls)
  const local = useLocalSections(videoId, videoTitle);
  const remote = useSavedSections(videoId, user, videoTitle);

  // Delegate to the appropriate backend based on auth state
  const active = user ? remote : local;

  return {
    ...active,
    isAuthenticated: !!user,
  };
};

export default useSections;
