/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// The YouTube IFrame API attaches itself to window once its script loads.
interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: (() => void) | null;
}

// Font packages are imported only for their CSS side effects.
declare module '@fontsource-variable/*';
