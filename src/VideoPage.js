import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Heading, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, RangeSliderMark } from '@chakra-ui/react';

const VideoPage = () => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoLength, setVideoLength] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [sliderValue, setSliderValue] = useState([null, null])
  const { videoId } = useParams();
  const apiKey = 'AIzaSyB8asYxNRmtKE_lhgOKoMcLiWNsbwvCSFs';
  const convertDurationToSeconds = (duration) => {
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    const seconds = parseInt(matches[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      const ytPlayer = new window.YT.Player('player', {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          fs: 0,
          showinfo: 0,
        },
        events: {
          onReady: onReady,
          onStateChange: onStateChange,
        },
      });
      setPlayer(ytPlayer);
    };
  }, [videoId]);

  useEffect(() => {
    let intervalId;

    const checkProgress = () => {
      if (player) {
        const currentTime = player.getCurrentTime();
        console.log('Current Time:', currentTime);
        console.log('End Time:', endTime);
        console.log('Start Time:', startTime);
        if (currentTime >= endTime) {
          player.seekTo(startTime, true);
        }
      }
    };

    if (player) {
      intervalId = setInterval(checkProgress, 1000);
    }

    return () => clearInterval(intervalId);
  }, [player, endTime, startTime]);

  useEffect(() => {
    fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`)
      .then(response => response.json())
      .then(data => {
        const duration = data.items[0]?.contentDetails?.duration;
        const totalDuration = convertDurationToSeconds(duration);

        setVideoLength(totalDuration);
        setEndTime(prevEndTime => {
          return prevEndTime === 0 ? totalDuration : prevEndTime;
        });

        console.log('Total Duration (seconds):', totalDuration);
      })
      .catch(error => {
        console.error('Error fetching video details:', error);
      });
  }, [videoId, apiKey]);

  const onReady = (event) => {
    console.log('YouTube player is ready:', event);
  };

  const onStateChange = (event) => {
    console.log('State changed:', event);

    if (event.data === window.YT.PlayerState.PLAYING) {
      // The interval is created and cleared in the useEffect
    }
  };

  const muteVideo = () => {
    if (player) {
      player.mute(); // Mute the video
    }
  };
  
  const unmuteVideo = () => {
    if (player) {
      player.unMute(); // Unmute the video
    }
  };

  const onRangeChange = (values) => {
    muteVideo();
    setCurrentTime(values[0]);
    if (player) {
      player.seekTo(values[0]);
    }

    setStartTime(values[0]);
    setEndTime(values[1]);
  };
  
  const onRangeChangeEnd = () => {
    unmuteVideo(); // Unmute the video when adjustment is complete
  };

  const formatSecondsToDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const pad = (value) => (value < 10 ? `0${value}` : value);

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    } else {
      return `${pad(minutes)}:${pad(remainingSeconds)}`;
    }
  };

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

  const onSpeedUp = () => {
    if (player) {
      const rate = player.getPlaybackRate();
      player.setPlaybackRate(rate + 0.25);
    }
  };

  const onSlowDown = () => {
    if (player) {
      const rate = player.getPlaybackRate();
      if (rate > 0.25) {
        player.setPlaybackRate(rate - 0.25);
      }
    }
  };

  const onRewind = () => {
    if (player) {
      const currentTime = player.getCurrentTime();
      player.seekTo(currentTime - 5, true);
    }
  };

  const onFastForward = () => {
    if (player) {
      const currentTime = player.getCurrentTime();
      player.seekTo(currentTime + 5, true);
    }
  };

  return (
    <Box>
      <Box id="player"></Box>
      <Box>
        <Button onClick={onPlay}>Play</Button>
        <Button onClick={onPause}>Pause</Button>
        <Button onClick={onSpeedUp}>Speed Up</Button>
        <Button onClick={onSlowDown}>Slow Down</Button>
        <Button onClick={onRewind}>Rewind</Button>
        <Button onClick={onFastForward}>Fast Forward</Button>
      </Box>
      <Box>
        <Heading as="h2">Loop Start: {formatSecondsToDuration(currentTime)}</Heading>
        <Heading as="h2">Loop End: {formatSecondsToDuration(endTime)}</Heading>
      </Box>
      <Box width={400} margin={50}>
        {videoLength && (
          <RangeSlider
            aria-label={['0', videoLength]}
            min={0}
            max={videoLength}
            defaultValue={[0, videoLength]}
            onChange={(values) => {
              onRangeChange(values);
              setSliderValue(values); // Assuming setSliderValue is a function to update the slider value
            }}
            onChangeEnd={onRangeChangeEnd}
          >
            <RangeSliderTrack bg='red.100'>
              <RangeSliderFilledTrack bg='tomato' />
            </RangeSliderTrack>
            <RangeSliderMark
              value={sliderValue[0]}
              textAlign='center'
              bg='blue.500'
              color='white'
              mt='-10'
              ml='-5'
              w='12'
            >
              {formatSecondsToDuration(sliderValue[0])}
            </RangeSliderMark>
            <RangeSliderMark
              value={sliderValue[1]}
              textAlign='center'
              bg='blue.500'
              color='white'
              mt='-10'
              ml='-5'
              w='12'
              bottom='-30px'
              left='100%'
            >
              {formatSecondsToDuration(sliderValue[1])}
            </RangeSliderMark>
            <RangeSliderThumb boxSize={6} index={0}>
              <Box color='tomato' />
            </RangeSliderThumb>
            <RangeSliderThumb boxSize={6} index={1}>
              <Box color='tomato' />
            </RangeSliderThumb>
          </RangeSlider>
        )}
      </Box>
    </Box>
  );
};

export default VideoPage;
