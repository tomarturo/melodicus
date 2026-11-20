let loading: Promise<typeof YT> | null = null;

/** Loads YouTube's IFrame Player API once and resolves with window.YT. */
export function loadYouTubeIframeApi(): Promise<typeof YT> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  loading ??= new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => {
      loading = null;
      reject(new Error('Could not load the YouTube player.'));
    };
    document.body.appendChild(script);
  });
  return loading;
}
