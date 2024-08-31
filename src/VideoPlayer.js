import React, { useState, useEffect } from 'react';

const VideoPlayer = ({ videoId, apiKey }) => {
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      const ytPlayer = new window.YT.Player('player', {
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          fs: 0,
          showinfo: 0,
        },
        events: {
          onReady: onPlayerReady,
        },
      });
      setPlayer(ytPlayer);
    };
  }, [videoId]);

  const onPlayerReady = () => {
    console.log('YouTube player is ready.');
  };

  const playVideo = () => {
    if (player) {
      player.playVideo();
    }
  };

  const pauseVideo = () => {
    if (player) {
      player.pauseVideo();
    }
  };

  const seekTo = (time) => {
    if (player) {
      player.seekTo(time);
    }
  };

  const muteVideo = () => {
    if (player) {
      player.mute();
    }
  };

  const unmuteVideo = () => {
    if (player) {
      player.unMute();
    }
  };

  const setVolume = (volume) => {
    if (player) {
      player.setVolume(volume);
    }
  };

  return (
    <div id="player">
      {/* The YouTube player will be embedded here */}
    </div>
  );
};

export default VideoPlayer;
