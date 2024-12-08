import { useState, useEffect } from 'react';
import { getSavedSections, createSavedSection, updateSavedSection, deleteSavedSection } from '../utils/sectionsFunctions';

const useSavedSections = (supabase, videoId, user, videoTitle) => {
  const [isSaved, setIsSaved] = useState(false);
  const [savedSongId, setSavedSongId] = useState(null);
  const [savedSections, setSavedSections] = useState([]);
  const [isAddingSectionName, setIsAddingSectionName] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [newSectionName, setNewSectionName] = useState('');

  // Check if video is saved
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
  }, [user, videoId, supabase]);

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
      const { data } = await createSavedSection(supabase, {
        saved_song_id: savedSongId,
        start_time: startTime,
        end_time: endTime,
        name: newSectionName.trim() || null
      });

      setSavedSections([...savedSections, data]);
      setNewSectionName('');
      setIsAddingSectionName(false);
    } catch (error) {
      console.error('Error saving section:', error);
      throw error;
    }
  };

  const updateSection = async (sectionId) => {
    try {
      const { data } = await updateSavedSection(supabase, sectionId, {
        name: newSectionName.trim() || null
      });

      setSavedSections(sections => 
        sections.map(section => 
          section.id === sectionId ? { ...section, name: data.name } : section
        )
      );

      setNewSectionName('');
      setIsEditingSection(false);
      setEditingSectionId(null);
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

  return {
    isSaved,
    savedSongId,
    savedSections,
    isAddingSectionName,
    isEditingSection,
    editingSectionId,
    newSectionName,
    setIsAddingSectionName,
    setIsEditingSection,
    setEditingSectionId,
    setNewSectionName,
    handleSaveVideo,
    saveSection,
    updateSection,
    deleteSection
  };
};

export default useSavedSections;