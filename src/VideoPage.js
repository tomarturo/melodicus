import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { PlayIcon, PauseIcon } from '@heroicons/react/20/solid';
import { DragHandleIcon, RepeatIcon } from '@chakra-ui/icons'
import { Circle, Text, Flex, IconButton, Icon, HStack, VStack, Box, Button, Heading, Slider, SliderTrack, SliderThumb, SliderMark, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, RangeSliderMark, Container } from '@chakra-ui/react';

const VideoPage = () => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLength, setVideoLength] = useState(null);
  const [startTimeHeader, setStartTimeHeader] = useState(0);
  const [endTimeHeader, setEndTimeHeader] = useState(0);
  const [isStartTimeHeaderActive, setIsStartTimeHeaderActive] = useState(false);
  const [isEndTimeHeaderActive, setIsEndTimeHeaderActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
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
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
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

  const onRangeChange = (values, index) => {
    muteVideo();
    setCurrentTime(values[0]);
    if (player) {
      player.seekTo(values[0]);
    }
    setStartTime(values[0]);
    setEndTime(values[1]);
    setStartTimeHeader(values[0]);
    setEndTimeHeader(values[1]);
    if (index === 0) {
      setIsStartTimeHeaderActive(true);
    } else if (index === 1) {
      setIsEndTimeHeaderActive(true);
    }
  };
  
  const onRangeChangeEnd = (index) => {
    unmuteVideo(); // Unmute the video when adjustment is complete
    setSliderValue([startTimeHeader, endTimeHeader]);
    if (index === 0) {
      setIsStartTimeHeaderActive(false);
    } else if (index === 1) {
      setIsEndTimeHeaderActive(false);
    }
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

  const onPlaybackRateChange = (value) => {
    setPlaybackRate(value / 60 + 0.25); // Map Slider value to playback rate (e.g., 60 maps to 1.0)
    if (player) {
      player.setPlaybackRate(value / 60 + 0.25);
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

  const restartLoop = () => {
    if (player) {
      player.seekTo(startTime);
    }
    console.log("Restart Loop Doofus!")
  };

  console.log('isEndTimeHeaderActive:', isEndTimeHeaderActive);
  console.log('endTimeHeader:', endTimeHeader);
  console.log('isStartTimeHeaderActive:', isStartTimeHeaderActive);

  return (
    <Flex direction='column' minH='100vh' bg='whiteAlpha.900'>
      <Header/>
      <Flex direction="column" flex="1">
        <Container>
          <VStack mb='8'>
            <Box id="player" mb='6'></Box>
            <Box width='100%' mb='2' px='2'>
              <HStack mb='8' justify='center' gap='4'>
                <VStack>
                  <Text as='b' align='left' fontSize='xs' casing='uppercase'>Loop Start</Text>
                  <Heading
                    px='12'
                    py='2'
                    borderRadius='sm'
                    as='h3'
                    size='md'
                    color={isStartTimeHeaderActive ? 'white' : 'gray.700'}
                    bg={isStartTimeHeaderActive ? 'purple.600' : 'gray.100'}
                    align="center"
                    onChange={(e) => setStartTimeHeader(e.target.value)}
                    >{formatSecondsToDuration(startTimeHeader)}
                  </Heading>
                </VStack>
                <VStack>
                  <Text as='b' align='left' fontSize='xs' casing='uppercase'>Loop End</Text>
                  <Heading
                    px='12'
                    py='2'
                    borderRadius='sm'
                    as='h3'
                    size='md'
                    color={isEndTimeHeaderActive ? 'white' : 'gray.700'}
                    bg={isEndTimeHeaderActive ? 'purple.600' : 'gray.100'}
                    align="center"
                    onChange={(e) => setEndTimeHeader(e.target.value)}
                    >{formatSecondsToDuration(endTimeHeader)}
                  </Heading>
                </VStack>
              </HStack>
              {videoLength && (
                <RangeSlider
                  aria-label={['0', videoLength]}
                  min={0}
                  max={videoLength}
                  defaultValue={[0, videoLength]}
                  onChange={(values, index) => {
                    onRangeChange(values);
                    setSliderValue(values);
                  }}
                  onChangeEnd={(index) => {
                    console.log('onChangeEnd index:', index);
                    onRangeChangeEnd(index);
                  }}
                  >
                  <RangeSliderTrack bg='gray.100' h={2}>
                    <RangeSliderFilledTrack bg='purple.600' />
                  </RangeSliderTrack>
                  <RangeSliderThumb 
                    boxSize={10} 
                    index={0} 
                    bg='white' 
                    border='1px' 
                    borderColor='purple.600'
                    onSelect={() => {
                      setIsStartTimeHeaderActive(true);
                      setIsEndTimeHeaderActive(false);
                    }}
                    >
                      <DragHandleIcon color='purple.600'/>
                  </RangeSliderThumb>
                  <RangeSliderThumb 
                    boxSize={10} 
                    index={1} 
                    bg='white' 
                    border='1px' 
                    borderColor='purple.600'
                    onSelect={() => {
                      setIsStartTimeHeaderActive(false);
                      setIsEndTimeHeaderActive(true);
                      console.log('Thumb selected')
                    }}
                    >
                    <DragHandleIcon color='purple.600'/>
                  </RangeSliderThumb>
                </RangeSlider>
              )}
            </Box>
            <HStack mb='6' justify='center'>
              <IconButton
                height='88px'
                width='88px'
                mx='2'
                border='0px'
                variant='outline'
                colorScheme='purple'
                isRound={true}
                aria-label='Play or Pause'
                fontSize='48px'
                icon={isPlaying ? <Icon as={PauseIcon} /> : <Icon as={PlayIcon} />}
                onClick={playPauseClick}
              />
              <IconButton
                height='88px'
                width='88px'
                border='0px'
                variant='outline'
                colorScheme='purple'
                isRound={true}
                aria-label='Play or Pause'
                fontSize='48px'
                icon={<RepeatIcon/>}
                onClick={restartLoop}
              />
            </HStack>
            <HStack justify='center' width='75%' mb='8' >
              <Slider defaultValue={60} min={0} max={120} step={20} onChange={onPlaybackRateChange}>
                <SliderTrack bg='purple.600'>
                  <Box position='relative' right={10} />
                </SliderTrack>
                <SliderThumb 
                boxSize={5} 
                border='1px' 
                borderColor='purple.600'/>
                <SliderMark value={0} mt='1' fontSize='sm' display='flex' flexDirection='column' alignItems='start'>
                  <Circle w='8px' h='8px' bg='purple.600' mt='-2' mb='3'/>
                  <Text align='left' ml='-2'>.25x</Text>
                </SliderMark>
                <SliderMark value={20} mt='1' ml='-2.5' fontSize='sm' display='flex' flexDirection='column' alignItems='center'>
                  <Circle w='8px' h='8px' bg='purple.600' mt='-2' mb='3'/>
                  <Text>.5x</Text>
                </SliderMark>
                <SliderMark value={40} mt='1' ml='-2.5' fontSize='sm' display='flex' flexDirection='column' alignItems='center'>
                  <Circle w='8px' h='8px' bg='purple.600' mt='-2' mb='3'/>
                  <Text>.75x</Text>
                </SliderMark>
                <SliderMark value={60} mt='1' ml='-2.5' fontSize='sm' display='flex' flexDirection='column' alignItems='center'>
                  <Circle w='8px' h='8px' bg='purple.600' mt='-2' mb='3'/>
                  <Text>1.0x</Text>
                </SliderMark>
                <SliderMark value={80} mt='1' ml='-2.5' fontSize='sm' display='flex' flexDirection='column' alignItems='center'>
                  <Circle w='8px' h='8px' bg='purple.600' mt='-2' mb='3'/>
                  <Text>1.25x</Text>
                </SliderMark>
                <SliderMark value={100} mt='1' ml='-2.5' fontSize='sm' display='flex' flexDirection='column' alignItems='center'>
                  <Circle w='8px' h='8px' bg='purple.600' mt='-2' mb='3'/>
                  <Text>1.5x</Text>
                </SliderMark>
                <SliderMark value={120} mt='1' ml='-1' fontSize='sm'>
                  <Circle w='8px' h='8px' bg='purple.600' mt='-2' mb='3'/>
                  <Text>1.75x</Text>
                </SliderMark>
              </Slider> 
            </HStack>
            <Text as='b' color='gray.600' align='left' fontSize='xs' casing='uppercase' mb='4'>Playback Speed</Text>
          </VStack>
        </Container>
      </Flex>
      <Footer/>
    </Flex>
  );
};

export default VideoPage;