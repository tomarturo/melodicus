import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import { PlayIcon, ForwardIcon, BackwardIcon, PauseIcon, Bars2Icon } from '@heroicons/react/20/solid'
import { Center, Text, IconButton, Icon, HStack, VStack, Box, Button, Heading, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, RangeSliderMark } from '@chakra-ui/react';

const VideoPage = () => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLength, setVideoLength] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState('1x');
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
          controls: 1,
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
      })
      .catch(error => {
        console.error('Error fetching video details:', error);
      });
  }, [videoId, apiKey]);

  const onReady = (event) => {
    console.log('YouTube player is ready:', event);
  };

  const onStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      // The interval is created and cleared in the useEffect
    }
  };

  const playPauseClick = () => {
    // Toggle the state on each click
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);

    // Call the appropriate function based on the current state
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
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

  const getPlaybackRate = () => {
    if (player) {
      const rate = player.getPlaybackRate();
      setPlaybackRate(rate.toString() + 'x'); // Convert rate to string before setting state
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
      getPlaybackRate();
    }
  };

  const onSlowDown = () => {
    if (player) {
      const rate = player.getPlaybackRate();
      if (rate > 0.25) {
        player.setPlaybackRate(rate - 0.25);
        getPlaybackRate();
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

  const sliderThumbIcon = (props) => { 
    return (
    <Icon as={Bars2Icon} color='white'/>
    )
};

  return (
    <Box>
      <Header/>
      <Center>
        <VStack>
          // Youtube player
          <Box id="player" mb='10'></Box>
          // Playback timeline, loop scrubber
          <Box width={600} mb='8'>
            {videoLength && (
              <RangeSlider
                aria-label={['0', videoLength]}
                min={0}
                max={videoLength}
                defaultValue={[0, videoLength]}
                onChange={(values) => {
                  onRangeChange(values);
                  setSliderValue(values);
                }}
                onChangeEnd={onRangeChangeEnd}>
                <RangeSliderTrack bg='gray.200'>
                  <RangeSliderFilledTrack bg='blue.500' />
                </RangeSliderTrack>
                <RangeSliderMark
                  value={sliderValue[0]}
                  textAlign='center'
                  color='black'
                  mt='-10'
                  ml='-5'
                  w='12'>
                  {formatSecondsToDuration(sliderValue[0])}
                </RangeSliderMark>
                <RangeSliderMark
                  value={sliderValue[1]}
                  textAlign='center'
                  color='black'
                  mt='-10'
                  ml='-5'
                  w='12'
                  bottom='-30px'
                >
                  {formatSecondsToDuration(sliderValue[1])}
                </RangeSliderMark>
                <RangeSliderThumb boxSize={6} index={0} bg='gray.800'>
                <Box as={sliderThumbIcon} />
                </RangeSliderThumb>
                <RangeSliderThumb boxSize={6} index={1} bg='gray.800'>
                  <Box as={sliderThumbIcon} />
                </RangeSliderThumb>
              </RangeSlider>
            )}
          </Box>
          <HStack width={600} mb='8' justify='center'>
            <IconButton
              height='56px'
              width='56px'
              variant='solid'
              isRound={true}
              colorScheme='blue'
              aria-label='Rewind'
              fontSize='24px'
              icon={<Icon as={BackwardIcon}/>}
              onClick={onRewind}
            />
            <IconButton
              height='88px'
              width='88px'
              variant='solid'
              isRound={true}
              colorScheme='blue'
              aria-label='Play or Pause'
              fontSize='48px'
              icon={isPlaying ? <Icon as={PauseIcon}/> : <Icon as={PlayIcon}/>}
              onClick={playPauseClick}
            />
            <IconButton

              height='56px'
              width='56px'
              variant='solid'
              isRound={true}
              colorScheme='blue'
              aria-label='Fast Forward'
              fontSize='24px'
              icon={<Icon as={ForwardIcon}/>}
              onClick={onFastForward}
            />
          </HStack>
          <HStack width={600} justify='center' mb='2'>
            <Button onClick={onSlowDown} colorScheme='blue' variant='outline'>
                Slow Down
            </Button>
            <Heading as='h3' size='lg' color='black' align="center" width='100px'>{playbackRate}</Heading>
            <Button onClick={onSpeedUp} colorScheme='blue' variant='outline'>
                Speed Up
            </Button>
          </HStack>
        </VStack>
      </Center>
    </Box>
  );
};

export default VideoPage;