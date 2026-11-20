import { z } from 'zod';

// Local sections use Date.now() numbers; links and older localStorage data may
// carry strings. Phase 3 replaces this with one ID scheme.
export const SectionIdSchema = z.union([z.string(), z.number()]);
export type SectionId = z.infer<typeof SectionIdSchema>;

/**
 * A saved loop as both storage backends hand it to the UI. Supabase rows carry
 * saved_song_id and created_at; localStorage entries carry video_id and
 * video_title instead.
 */
export const SectionSchema = z.object({
  id: SectionIdSchema,
  name: z.string().nullable(),
  start_time: z.number(),
  end_time: z.number(),
  video_id: z.string().optional(),
  video_title: z.string().nullable().optional(),
  saved_song_id: SectionIdSchema.optional(),
  created_at: z.string().optional(),
});
export type Section = z.infer<typeof SectionSchema>;
