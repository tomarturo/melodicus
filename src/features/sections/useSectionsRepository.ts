import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { LocalSectionsRepo } from './localSectionsRepo';
import { SupabaseSectionsRepo } from './supabaseSectionsRepo';
import type { SectionsRepository } from './types';

let localRepo: LocalSectionsRepo | null = null;

/** The browser's guest storage. Created on first use so tests can swap localStorage first. */
export const getLocalSectionsRepo = (): LocalSectionsRepo => (localRepo ??= new LocalSectionsRepo());

export interface ActiveRepository {
  repo: SectionsRepository;
  /** Separates cached data per account: 'guest' or the user's ID. */
  scope: string;
}

/** Supabase for a signed-in user, this browser's localStorage for a guest. */
export function useSectionsRepository(): ActiveRepository {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useMemo(
    () =>
      userId
        ? { repo: new SupabaseSectionsRepo(supabase, userId), scope: userId }
        : { repo: getLocalSectionsRepo(), scope: 'guest' },
    [userId],
  );
}
