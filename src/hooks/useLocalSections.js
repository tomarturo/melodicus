import { useState, useEffect, useCallback } from 'react';

const useLocalSections = (videoId, videoTitle) => {
  const [savedSections, setSavedSections] = useState([]);
  const [isAddingSectionName, setIsAddingSectionName] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [currentEditingSection, setCurrentEditingSection] = useState(null);

  // Storage key consistent across the app - wrap in useCallback
  const getStorageKey = useCallback(() => `video_sections_${videoId}`, [videoId]);

  // Load saved sections from localStorage on mount
  useEffect(() => {
    const loadSections = () => {
      try {
        const storageKey = getStorageKey();
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
          // Parse and normalize sections to ensure consistent format
          const parsedSections = JSON.parse(savedData);
          
          // Ensure all sections have the required properties
          const normalizedSections = parsedSections.map(section => ({
            ...section,
            id: section.id || Date.now() + Math.floor(Math.random() * 1000),
            name: section.name || '',
            video_id: section.video_id || videoId,
            video_title: section.video_title || videoTitle
          }));
          
          setSavedSections(normalizedSections);
        }
      } catch (error) {
        console.error('Error loading sections from localStorage:', error);
      }
    };
    
    loadSections();
  }, [videoId, videoTitle, getStorageKey]); // Add getStorageKey to dependencies

  // Save to localStorage with proper error handling
  const saveToLocalStorage = useCallback((sections) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(sections));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [getStorageKey]);

  // Save a new section
  const saveSection = (startTime, endTime) => {
    const newSection = {
      id: Date.now(), // Use timestamp as unique ID
      name: newSectionName,
      start_time: startTime,
      end_time: endTime,
      video_id: videoId,
      video_title: videoTitle
    };

    const updatedSections = [...savedSections, newSection];
    setSavedSections(updatedSections);
    saveToLocalStorage(updatedSections);
    setIsAddingSectionName(false);
    setNewSectionName('');
  };

  // Update an existing section
  const updateSection = () => {
    if (!currentEditingSection) return;

    const updatedSections = savedSections.map(section => {
      // Convert IDs to string for comparison to handle both number and string IDs
      const sectionIdStr = String(section.id);
      const editingIdStr = String(currentEditingSection.id);
      
      if (sectionIdStr === editingIdStr) {
        return { ...section, name: newSectionName };
      }
      return section;
    });

    setSavedSections(updatedSections);
    saveToLocalStorage(updatedSections);
    setIsAddingSectionName(false);
    setNewSectionName('');
    setCurrentEditingSection(null);
    setIsEditingSection(false);
  };

  // Delete a section
  const deleteSection = (sectionId) => {
    // Convert IDs to string for comparison to handle both number and string IDs
    const idToDeleteStr = String(sectionId);
    
    const updatedSections = savedSections.filter(section => 
      String(section.id) !== idToDeleteStr
    );
    
    setSavedSections(updatedSections);
    saveToLocalStorage(updatedSections);
  };

  // Start editing a section
  const startEditingSection = (section) => {
    setCurrentEditingSection(section);
    setNewSectionName(section.name || '');
    setIsEditingSection(true);
    setIsAddingSectionName(true);
  };

  // Update sections from external source (like URL parameters)
  const updateSectionsFromExternal = useCallback((sections) => {
    // Normalize incoming sections to ensure consistent format
    const normalizedSections = sections.map(section => ({
      ...section,
      id: section.id || Date.now() + Math.floor(Math.random() * 1000),
      name: section.name || '',
      video_id: section.video_id || videoId,
      video_title: section.video_title || videoTitle
    }));
    
    setSavedSections(normalizedSections);
    saveToLocalStorage(normalizedSections);
  }, [videoId, videoTitle, saveToLocalStorage]);

  return {
    savedSections,
    isAddingSectionName,
    isEditingSection,
    newSectionName,
    setIsAddingSectionName,
    setNewSectionName,
    saveSection,
    updateSection,
    deleteSection,
    startEditingSection,
    setSavedSections: updateSectionsFromExternal
  };
};

export default useLocalSections;