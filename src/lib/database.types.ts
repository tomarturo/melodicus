// Mirrors supabase/migrations. Regenerate from the live project with
// `npm run db:types` after a schema change.

export type Database = {
  public: {
    Tables: {
      saved_songs: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          video_id: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_sections: {
        Row: {
          id: string;
          user_id: string;
          saved_song_id: string;
          start_time: number;
          end_time: number;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          saved_song_id: string;
          start_time: number;
          end_time: number;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          saved_song_id?: string;
          start_time?: number;
          end_time?: number;
          name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_sections_saved_song_id_fkey';
            columns: ['saved_song_id'];
            isOneToOne: false;
            referencedRelation: 'saved_songs';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type SavedSongRow = Database['public']['Tables']['saved_songs']['Row'];
export type SavedSectionRow = Database['public']['Tables']['saved_sections']['Row'];
