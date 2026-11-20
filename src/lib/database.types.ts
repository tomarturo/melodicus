// Hand-written to match how the app queries Supabase today. Replace with the
// output of `supabase gen types typescript` once the schema is in
// supabase/migrations (phase 2, part 2). IDs are typed as string | number
// because the real column types (bigint or uuid) aren't known yet.

type RowId = string | number;

export type Database = {
  public: {
    Tables: {
      saved_songs: {
        Row: {
          id: RowId;
          user_id: string;
          video_id: string;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: RowId;
          user_id?: string;
          video_id: string;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: RowId;
          user_id?: string;
          video_id?: string;
          title?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_sections: {
        Row: {
          id: RowId;
          saved_song_id: RowId;
          start_time: number;
          end_time: number;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: RowId;
          saved_song_id: RowId;
          start_time: number;
          end_time: number;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: RowId;
          saved_song_id?: RowId;
          start_time?: number;
          end_time?: number;
          name?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
