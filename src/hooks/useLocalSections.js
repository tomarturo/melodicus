import { useState, useEffect } from 'react';

const useLocalSections = (videoId, videoTitle) => {
  const [savedSections, setSavedSections] = useState([]);
  const [isAddingSectionName, setIsAddingSectionName] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [currentEditingSection, setCurrentEditingSection] = useState(null);

  // Load saved sections from localStorage on mount
  useEffect(() => {
    const storageKey = `video_sections_${videoId}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      setSavedSections(JSON.parse(savedData));
    }
  }, [videoId]);

  const saveToLocalStorage = (sections) => {
    const storageKey = `video_sections_${videoId}`;
    localStorage.setItem(storageKey, JSON.stringify(sections));
  };

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

  const updateSection = () => {
    if (!currentEditingSection) return;

    const updatedSections = savedSections.map(section => 
      section.id === currentEditingSection.id 
        ? { ...section, name: newSectionName }
        : section
    );

    setSavedSections(updatedSections);
    saveToLocalStorage(updatedSections);
    setIsAddingSectionName(false);
    setNewSectionName('');
    setCurrentEditingSection(null);
    setIsEditingSection(false);
  };

  const deleteSection = (sectionId) => {
    const updatedSections = savedSections.filter(section => section.id !== sectionId);
    setSavedSections(updatedSections);
    saveToLocalStorage(updatedSections);
  };

  const startEditingSection = (section) => {
    setCurrentEditingSection(section);
    setNewSectionName(section.name);
    setIsEditingSection(true);
    setIsAddingSectionName(true);
  };

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
    startEditingSection
  };
};

export default useLocalSections;