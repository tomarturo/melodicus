import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Button, AbsoluteCenter, Flex, Icon, HStack, VStack, Box, Container } from '@chakra-ui/react';
import VideoDisplay from './VideoDisplay';
import LoopSelector from './LoopSelector';
import PlaybackControls from './PlaybackControls';
import PlaybackRateSelector from './PlaybackRateSelector';


const VideoPage = () => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLength, setVideoLength] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [sliderValue, setSliderValue] = useState([null, null])
  const { videoId } = useParams();
  const apiKey = 'AIzaSyCz_FUhutA28tmaBM-_EGIuFFfPxuA_irQ';
  const convertDurationToSeconds = (duration) => {
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    const seconds = parseInt(matches[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };

  const onStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    console.log("Setting up YouTube API");
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API is ready");
      const ytPlayer = new window.YT.Player('player', {
        width: '0',
        height: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          fs: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event) => {
            console.log("Player is ready", event.target);
            setPlayer(event.target);
          },
          onStateChange: onStateChange,
        },
      });
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, [videoId]);

  useEffect(() => {
    console.log("Player object updated:", player);
  }, [player]);

  useEffect(() => {
    let intervalId;

    const checkProgress = () => {
      if (player && player.getCurrentTime && typeof player.getCurrentTime === 'function') {
        try {
          const currentTime = player.getCurrentTime();
          if (currentTime >= endTime) {
            player.seekTo(startTime, true);
          }
        } catch (error) {
          console.error("Error in checkProgress:", error);
        }
      } else {
        console.log("Player or getCurrentTime not available");
      }
    };

    if (player && player.getPlayerState) {
      console.log("Setting up interval");
      const setupInterval = () => {
        if (player.getPlayerState() !== -1) {
          intervalId = setInterval(checkProgress, 1000); // Increased to 1 second for debugging
        } else {
          setTimeout(setupInterval, 1000);
        }
      };

      setupInterval();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [player, endTime, startTime]);

  useEffect(() => {
    fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${apiKey}`)
      .then(response => response.json())
      .then(data => {
        const duration = data.items[0]?.contentDetails?.duration;
        const thumbnailUrl = data.items[0]?.snippet?.thumbnails?.medium?.url;
        const totalDuration = convertDurationToSeconds(duration);

        setVideoLength(totalDuration);
        setEndTime(prevEndTime => (prevEndTime === 0 ? totalDuration : prevEndTime));
        setVideoThumbnail(thumbnailUrl);
      })
      .catch(error => {
        console.error('Error fetching video details:', error);
      });
  }, [videoId, apiKey]);

  //  loop selector functions

  const getCurrentTime = useCallback(() => {
    if (player) {
      const time = player.getCurrentTime();
      setCurrentTime(time);
    }
  }, [player, setCurrentTime]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      getCurrentTime();
    }, 100);

    return () => clearInterval(intervalId);
  }, [videoId, videoLength, getCurrentTime]);

  const handleRangeChange = (values) => {
    muteVideo();
    if (player) {
      player.seekTo(values[0]);
    }
    setStartTime(values[0]);
    setEndTime(values[1]);
  };

  const handleRangeChangeEnd = () => {
    unmuteVideo();
    setSliderValue([startTime, endTime]);
  };


  //  video controls
  const onPlay = () => {
    if (player) {
      player.playVideo();
    }
  };

  const onPause = () => {
    if (player) {
      player.pauseVideo();
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

  const playPauseClick = () => {
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const restartLoop = () => {
    if (player) {
      player.seekTo(startTime);
    }
  };

  return (
    <Flex direction='column' minH='100vh' bg='#F5F5F5'>
      <Header />
      <Flex direction="column" flex="1">
        <VideoDisplay videoThumbnail={videoThumbnail} />
        <Container maxW='900px' zIndex={100} px={[2, 4]}>
          <VStack mb='8'>
            <Box id="player" mb='6'></Box>
            <Box width='100%' mb='2'>
              {videoLength && (
                <LoopSelector
                  videoLength={videoLength}
                  currentTime={currentTime}
                  startTime={startTime}
                  endTime={endTime}
                  onRangeChange={handleRangeChange}
                  onRangeChangeEnd={handleRangeChangeEnd}
                />
              )}
            </Box>
            <PlaybackControls
              isPlaying={isPlaying}
              playPauseClick={playPauseClick}
              restartLoop={restartLoop}
            />
            <PlaybackRateSelector player={player} />
          </VStack>
        </Container>
      </Flex>
      <Footer />
    </Flex>
  );
};

export default VideoPage;