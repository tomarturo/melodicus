import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Supabase pauses idle projects, so the first request after a pause can fail.
        retry: 2,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Retrying a write could save the same loop twice.
        retry: false,
      },
    },
  });
