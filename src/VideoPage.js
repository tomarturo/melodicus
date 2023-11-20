import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { PlayIcon, ForwardIcon, BackwardIcon, PauseIcon, Bars2Icon, ArrowsRightLeftIcon } from '@heroicons/react/20/solid'
import { Flex, IconButton, Icon, HStack, VStack, Box, Button, Heading, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, RangeSliderMark, Container } from '@chakra-ui/react';

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
        width: '100%',
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
    <Icon as={ArrowsRightLeftIcon} color='blackAlpha.900'/>
    )
};

  return (
    <Flex direction='column' minH='100vh'>
      <Header/>
      <Flex direction="column" flex="1">
        <Container>
          <VStack mb='8'>
            <Box id="player" mb='10'></Box>
            <Box width='100%' mb='8' px='2'>
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
                  <RangeSliderTrack bg='blackAlpha.200'>
                    <RangeSliderFilledTrack bg='purple.600' />
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
                  <RangeSliderThumb boxSize={6} index={0} >
                  <Box as={sliderThumbIcon} />
                  </RangeSliderThumb>
                  <RangeSliderThumb boxSize={6} index={1}>
                    <Box as={sliderThumbIcon} />
                  </RangeSliderThumb>
                </RangeSlider>
              )}
            </Box>
            <HStack mb='8' justify='center'>
              <IconButton
                height='56px'
                width='56px'
                colorScheme='purple'
                bg='purple.600'
                variant='solid'
                isRound={true}
                aria-label='Rewind'
                fontSize='24px'
                icon={<Icon as={BackwardIcon} />}
                onClick={onRewind}
              />
              <IconButton
                height='88px'
                width='88px'
                mx='2'
                variant='solid'
                colorScheme='purple'
                bg='purple.600'
                isRound={true}
                aria-label='Play or Pause'
                fontSize='48px'
                icon={isPlaying ? <Icon as={PauseIcon} /> : <Icon as={PlayIcon} />}
                onClick={playPauseClick}
              />
              <IconButton
                height='56px'
                width='56px'
                variant='solid'
                isRound={true}
                colorScheme='purple'
                bg='purple.600'
                aria-label='Fast Forward'
                fontSize='24px'
                icon={<Icon as={ForwardIcon}/>}
                onClick={onFastForward}
              />
            </HStack>
            <HStack justify='center'>
              <Button onClick={onSlowDown} colorScheme='purple' size='sm' variant='outline'>
                  Slow Down
              </Button>
              <Heading as='h3' size='lg' color='gray.600' align="center"  width={['80px','100px']}>{playbackRate}</Heading>
              <Button onClick={onSpeedUp} colorScheme='purple' size='sm' variant='outline'>
                  Speed Up
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Flex>
      <Footer/>
    </Flex>
  );
};

export default VideoPage;