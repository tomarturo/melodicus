import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getSavedSections, createSavedSection, updateSavedSection, deleteSavedSection } from '../utils/sectionsFunctions';

const useSavedSections = (videoId, user, videoTitle) => {
  const [isSaved, setIsSaved] = useState(false);
  const [savedSongId, setSavedSongId] = useState(null);
  const [savedSections, setSavedSections] = useState([]);
  const [isAddingSectionName, setIsAddingSectionName] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [currentEditingSection, setCurrentEditingSection] = useState(null);
  const [newSectionName, setNewSectionName] = useState('');

  // Check if video is saved and load sections
  useEffect(() => {
    if (!user) return;

    const checkIfSaved = async () => {
      const { data } = await supabase
        .from('saved_songs')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setIsSaved(true);
        setSavedSongId(data.id);
        const { data: sections } = await getSavedSections(supabase, data.id);
        setSavedSections(sections || []);
      } else {
        setIsSaved(false);
        setSavedSongId(null);
        setSavedSections([]);
      }
    };

    checkIfSaved();
  }, [user, videoId]);

  const handleSaveVideo = async () => {
    try {
      if (isSaved) {
        await supabase
          .from('saved_songs')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        setIsSaved(false);
        setSavedSongId(null);
        setSavedSections([]);
      } else {
        const { data } = await supabase
          .from('saved_songs')
          .insert([{ video_id: videoId, title: videoTitle }])
          .select()
          .single();

        setIsSaved(true);
        setSavedSongId(data.id);
      }
    } catch (error) {
      console.error('Error saving video:', error);
      throw error;
    }
  };

  const saveSection = async (startTime, endTime) => {
    try {
      let songId = savedSongId;

      // Auto-save video if not already saved
      if (!isSaved) {
        const { data } = await supabase
          .from('saved_songs')
          .insert([{ video_id: videoId, title: videoTitle }])
          .select()
          .single();
        setIsSaved(true);
        setSavedSongId(data.id);
        songId = data.id;
      }

      const { data } = await createSavedSection(supabase, {
        saved_song_id: songId,
        start_time: startTime,
        end_time: endTime,
        name: newSectionName.trim() || null
      });

      setSavedSections(prev => [...prev, data]);
      setNewSectionName('');
      setIsAddingSectionName(false);
    } catch (error) {
      console.error('Error saving section:', error);
      throw error;
    }
  };

  const updateSection = async () => {
    if (!currentEditingSection) return;

    try {
      const { data } = await updateSavedSection(supabase, currentEditingSection.id, {
        name: newSectionName.trim() || null
      });

      setSavedSections(sections =>
        sections.map(section =>
          section.id === currentEditingSection.id ? { ...section, name: data.name } : section
        )
      );

      setNewSectionName('');
      setIsEditingSection(false);
      setCurrentEditingSection(null);
      setIsAddingSectionName(false);
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  };

  const deleteSection = async (sectionId) => {
    try {
      await deleteSavedSection(supabase, sectionId);
      setSavedSections(sections =>
        sections.filter(section => section.id !== sectionId)
      );
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  };

  const startEditingSection = (section) => {
    setCurrentEditingSection(section);
    setNewSectionName(section.name || '');
    setIsEditingSection(true);
    setIsAddingSectionName(true);
  };

  const reloadSections = useCallback(async () => {
    if (!savedSongId) return;
    const { data: sections } = await getSavedSections(supabase, savedSongId);
    setSavedSections(sections || []);
  }, [savedSongId]);

  return {
    isSaved,
    savedSongId,
    savedSections,
    isAddingSectionName,
    isEditingSection,
    newSectionName,
    setIsAddingSectionName,
    setNewSectionName,
    handleSaveVideo,
    saveSection,
    updateSection,
    deleteSection,
    startEditingSection,
    setSavedSections,
    reloadSections
  };
};

export default useSavedSections;
