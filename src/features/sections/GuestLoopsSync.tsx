import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { copyGuestLoopsToAccount } from './copyGuestLoops';
import { SupabaseSectionsRepo } from './supabaseSectionsRepo';
import { getLocalSectionsRepo } from './useSectionsRepository';
import { useNotify } from '../../lib/notify';
import { track } from '../../lib/analytics';

/**
 * When someone is signed in and this browser still holds loops they saved as a
 * guest, copies them into the account. Runs at login and at every page load
 * while signed in, so anything that failed to copy is retried.
 */
const GuestLoopsSync = () => {
  const { user } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      syncedFor.current = null;
      return;
    }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;

    const local = getLocalSectionsRepo();
    void (async () => {
      if ((await local.listSavedSongs()).length === 0) return;
      const { added, failed } = await copyGuestLoopsToAccount(local, new SupabaseSectionsRepo(supabase, user.id));
      await queryClient.invalidateQueries();
      if (added > 0 || failed > 0) track('guest_loops_synced', { added, failed });
      if (added > 0) {
        notify({
          tone: 'success',
          title: added === 1 ? '1 loop added to your account' : `${added} loops added to your account`,
        });
      }
      if (failed > 0) {
        notify({
          tone: 'warning',
          title: 'Some loops couldn’t be added to your account',
          description: 'They’re still saved in this browser, and will be tried again next time you log in.',
          duration: 6000,
        });
      }
    })();
  }, [user, notify, queryClient]);

  return null;
};

export default GuestLoopsSync;
