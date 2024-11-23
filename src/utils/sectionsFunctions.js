// Create a new saved section
export const createSavedSection = async (supabase, { saved_song_id, start_time, end_time, name }) => {
    const { data: savedSection, error } = await supabase
      .from('saved_sections')
      .insert([{ saved_song_id, start_time, end_time, name }])
      .select()
      .single()
  
    return { data: savedSection, error }
  }
  
  // Get all saved sections for a specific saved song
  export const getSavedSections = async (supabase, saved_song_id) => {
    const { data: sections, error } = await supabase
      .from('saved_sections')
      .select('*')
      .eq('saved_song_id', saved_song_id)
      .order('created_at', { ascending: true })
  
    return { data: sections, error }
  }
  
  // Update a saved section
  export const updateSavedSection = async (supabase, sectionId, { start_time, end_time, name }) => {
    const updates = {}
    if (start_time !== undefined) updates.start_time = start_time
    if (end_time !== undefined) updates.end_time = end_time
    if (name !== undefined) updates.name = name
  
    const { data: updatedSection, error } = await supabase
      .from('saved_sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single()
  
    return { data: updatedSection, error }
  }
  
  // Delete a saved section
  export const deleteSavedSection = async (supabase, sectionId) => {
    const { error } = await supabase
      .from('saved_sections')
      .delete()
      .eq('id', sectionId)
  
    return { error }
  }