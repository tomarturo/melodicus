import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getSavedSections, createSavedSection, updateSavedSection, deleteSavedSection } from '../utils/sectionsFunctions';
import type { User } from '@supabase/supabase-js';
import type { Section, SectionId } from '../types/section';
import type { SectionsApi } from './useSections';

// saved_songs.title is required, and the title arrives from the YouTube API a
// moment after the page loads.
const TITLE_NOT_LOADED = 'The video is still loading. Try again in a moment.';

const useSavedSections = (videoId: string, user: User | null, videoTitle: string | null) => {
  const [isSaved, setIsSaved] = useState(false);
  const [savedSongId, setSavedSongId] = useState<string | null>(null);
  const [savedSections, setSavedSections] = useState<Section[]>([]);
  const [isAddingSectionName, setIsAddingSectionName] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [currentEditingSection, setCurrentEditingSection] = useState<Section | null>(null);
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
        const { data: sections, error: sectionsError } = await getSavedSections(supabase, data.id);
        if (sectionsError) console.error('Error loading sections:', sectionsError);
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
    if (!user) return;
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
        if (!videoTitle) throw new Error(TITLE_NOT_LOADED);
        const { data, error } = await supabase
          .from('saved_songs')
          .insert([{ video_id: videoId, title: videoTitle }])
          .select()
          .single();
        if (error) throw error;
        if (!data) throw new Error('The song was not saved: no row came back.');

        setIsSaved(true);
        setSavedSongId(data.id);
      }
    } catch (error) {
      console.error('Error saving video:', error);
      throw error;
    }
  };

  const saveSection = async (startTime: number, endTime: number) => {
    try {
      let songId = savedSongId;
      if (!user) throw new Error('Log in to save loops to your account.');

      // Auto-save video if not already saved
      if (!isSaved) {
        if (!videoTitle) throw new Error(TITLE_NOT_LOADED);
        const { data, error } = await supabase
          .from('saved_songs')
          .insert([{ video_id: videoId, title: videoTitle }])
          .select()
          .single();
        if (error) throw error;
        if (!data) throw new Error('The song was not saved: no row came back.');
        setIsSaved(true);
        setSavedSongId(data.id);
        songId = data.id;
      }

      if (songId === null) throw new Error('The song was not saved.');
      const { data, error } = await createSavedSection(supabase, {
        saved_song_id: songId,
        start_time: startTime,
        end_time: endTime,
        name: newSectionName.trim() || null
      });

      // Supabase reports failure as { data: null, error }. Dropping the error
      // and storing data regardless put a null in savedSections while the UI
      // still reported success, and the null then broke every consumer.
      if (error) throw error;
      if (!data) throw new Error('The loop was not saved: no row came back.');

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
      const { data, error } = await updateSavedSection(supabase, String(currentEditingSection.id), {
        name: newSectionName.trim() || null
      });

      if (error) throw error;
      if (!data) throw new Error('The loop was not updated: no row came back.');

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

  const deleteSection = async (sectionId: SectionId) => {
    try {
      const { error } = await deleteSavedSection(supabase, String(sectionId));
      if (error) throw error;
      setSavedSections(sections =>
        sections.filter(section => section.id !== sectionId)
      );
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  };

  const startEditingSection = (section: Section) => {
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

  const api: SectionsApi & {
    isSaved: boolean;
    savedSongId: string | null;
    handleSaveVideo: () => Promise<void>;
    setSavedSections: typeof setSavedSections;
  } = {
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
  return api;
};

export default useSavedSections;
