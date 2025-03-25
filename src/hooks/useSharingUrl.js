import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Simplified hook to detect URL sections without automatically applying them
 */
const useSharingUrl = (videoId) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasSectionsInUrl, setHasSectionsInUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [urlSections, setUrlSections] = useState(null);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const encodedSections = params.get('sections');
    
    if (encodedSections) {
      try {
        // Decode the timestamp data
        const sectionsString = decodeURIComponent(atob(encodedSections));
        const sections = JSON.parse(sectionsString);
        
        // Store the sections but don't apply them automatically
        setUrlSections(sections);
        setHasSectionsInUrl(true);
        
        // Clean up the URL
        navigate(location.pathname, { replace: true });
      } catch (error) {
        console.error('Error decoding sections from URL:', error);
      }
    }
    
    setIsLoading(false);
  }, [location, navigate, videoId]);

  // Function to apply the sections from URL
  const importSectionsFromUrl = () => {
    if (!urlSections) return false;
    
    try {
      // Normalize the sections
      const normalizedSections = urlSections.map(section => ({
        id: section.id || Date.now() + Math.floor(Math.random() * 1000),
        start_time: section.start_time !== undefined ? section.start_time : 
                   (section.startTime !== undefined ? section.startTime : 0),
        end_time: section.end_time !== undefined ? section.end_time : 
                 (section.endTime !== undefined ? section.endTime : 0),
        name: section.name || '',
        video_id: videoId,
        video_title: section.video_title || section.videoTitle || ''
      }));
      
      // Save to localStorage
      const storageKey = `video_sections_${videoId}`;
      localStorage.setItem(storageKey, JSON.stringify(normalizedSections));
      
      // Return true to indicate success
      return true;
    } catch (error) {
      console.error('Error applying sections from URL:', error);
      return false;
    }
  };

  return { 
    hasSectionsInUrl, 
    isLoading,
    importSectionsFromUrl,
    sectionsCount: urlSections ? urlSections.length : 0
  };
};

export default useSharingUrl;