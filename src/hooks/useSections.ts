import type { User } from '@supabase/supabase-js';
import type { Section, SectionId } from '../types/section';
import useLocalSections from './useLocalSections';
import useSavedSections from './useSavedSections';

/** What both storage backends expose to the video page. */
export interface SectionsApi {
  savedSections: Section[];
  isAddingSectionName: boolean;
  isEditingSection: boolean;
  newSectionName: string;
  setIsAddingSectionName: (value: boolean) => void;
  setNewSectionName: (value: string) => void;
  saveSection: (startTime: number, endTime: number) => void | Promise<void>;
  updateSection: () => void | Promise<void>;
  deleteSection: (sectionId: SectionId) => void | Promise<void>;
  startEditingSection: (section: Section) => void;
  reloadSections: () => void | Promise<void>;
}

const useSections = (videoId: string, user: User | null, videoTitle: string | null) => {
  // Always call both hooks (React rules of hooks — no conditional calls)
  const local = useLocalSections(videoId, videoTitle);
  const remote = useSavedSections(videoId, user, videoTitle);

  // Delegate to the appropriate backend based on auth state
  const active: SectionsApi = user ? remote : local;

  return {
    ...active,
    isAuthenticated: !!user,
  };
};

export default useSections;
