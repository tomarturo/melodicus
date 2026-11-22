import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { getLocalSectionsRepo } from '../sections/useSectionsRepository';

/**
 * Deletes the signed-in account, and its songs and loops with it (the
 * database's delete_own_account), then signs out here and forgets the songs
 * this browser kept as a guest, so they aren't copied into a new account.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
  // The account is gone, so its session can't be ended on the server: clear it here.
  await supabase.auth.signOut({ scope: 'local' });
  getLocalSectionsRepo().clearAll();
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => queryClient.clear(),
  });
}
