import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

type Client = SupabaseClient<Database>;
type SectionInsert = Database['public']['Tables']['saved_sections']['Insert'];
type SectionUpdate = Pick<Database['public']['Tables']['saved_sections']['Update'], 'start_time' | 'end_time' | 'name'>;

// Create a new saved section
export const createSavedSection = async (supabase: Client, { saved_song_id, start_time, end_time, name }: SectionInsert) => {
  const { data, error } = await supabase
    .from('saved_sections')
    .insert([{ saved_song_id, start_time, end_time, name }])
    .select()
    .single();

  return { data, error };
};

// Get all saved sections for a specific saved song
export const getSavedSections = async (supabase: Client, saved_song_id: string) => {
  const { data, error } = await supabase
    .from('saved_sections')
    .select('*')
    .eq('saved_song_id', saved_song_id)
    .order('created_at', { ascending: true });

  return { data, error };
};

// Update a saved section
export const updateSavedSection = async (supabase: Client, sectionId: string, { start_time, end_time, name }: SectionUpdate) => {
  const updates: SectionUpdate = {};
  if (start_time !== undefined) updates.start_time = start_time;
  if (end_time !== undefined) updates.end_time = end_time;
  if (name !== undefined) updates.name = name;

  const { data, error } = await supabase
    .from('saved_sections')
    .update(updates)
    .eq('id', sectionId)
    .select()
    .single();

  return { data, error };
};

// Delete a saved section
export const deleteSavedSection = async (supabase: Client, sectionId: string) => {
  const { error } = await supabase
    .from('saved_sections')
    .delete()
    .eq('id', sectionId);

  return { error };
};
