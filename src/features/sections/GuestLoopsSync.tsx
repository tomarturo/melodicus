import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { copyGuestLoopsToAccount } from './copyGuestLoops';
import { SupabaseSectionsRepo } from './supabaseSectionsRepo';
import { getLocalSectionsRepo } from './useSectionsRepository';

/**
 * When someone is signed in and this browser still holds loops they saved as a
 * guest, copies them into the account. Runs at login and at every page load
 * while signed in, so anything that failed to copy is retried.
 */
const GuestLoopsSync = () => {
  const { user } = useAuth();
  const toast = useToast();
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
      if (added > 0) {
        toast({
          title: added === 1 ? '1 loop added to your account' : `${added} loops added to your account`,
          status: 'success',
          duration: 4000,
        });
      }
      if (failed > 0) {
        toast({
          title: 'Some loops could not be added to your account',
          description: 'They are still saved in this browser and will be tried again next time.',
          status: 'warning',
          duration: 6000,
        });
      }
    })();
  }, [user, toast, queryClient]);

  return null;
};

export default GuestLoopsSync;
