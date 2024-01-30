import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { PlayIcon, PauseIcon } from '@heroicons/react/20/solid';
import { DragHandleIcon, RepeatIcon } from '@chakra-ui/icons'
import { Button, AbsoluteCenter, Flex, Icon, HStack, VStack, Box, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, RangeSliderMark, Container } from '@chakra-ui/react';
import PlaybackRateSelector from './PlaybackRateSelector';

const VideoPage = () => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLength, setVideoLength] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [startTimeHeader, setStartTimeHeader] = useState(0);
  const [endTimeHeader, setEndTimeHeader] = useState(0);
  const [isStartTimeHeaderActive, setIsStartTimeHeaderActive] = useState(false);
  const [isEndTimeHeaderActive, setIsEndTimeHeaderActive] = useState(false);
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

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      const ytPlayer = new window.YT.Player('player', {
        width: '0',
        height:'0',
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
      player.mute();
    }
  };
  
  const unmuteVideo = () => {
    if (player) {
      player.unMute();
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
    unmuteVideo(); 
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
  };

  console.log('isEndTimeHeaderActive:', videoLength);
  console.log('endTimeHeader:', endTimeHeader);
  console.log('isStartTimeHeaderActive:', isStartTimeHeaderActive);

  return (
    <Flex direction='column' minH='100vh' bg='#F5F5F5'>
      <Header/>
      <Flex direction="column" flex="1">
      <Box
          pos='relative'
          w="100vw"
          h={["60vh", "70vh"]}
          inset="0"
          backgroundImage={videoThumbnail}
          backgroundSize="11px 11px"
          backgroundRepeat="repeat"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            backdropFilter:'auto', 
            backdropBlur:'8px', 
            backdropInvert:'0.175',
            backdropContrast:'0.8',
            backdropSaturate:'1.7',
          }}
        >
          <AbsoluteCenter
            h={[300, 400]}
            w={[300, 400]}
            borderRadius='md' 
            backgroundImage={videoThumbnail}
            backgroundPosition="center"
            backgroundSize='cover'
            backgroundRepeat='no-repeat'
            boxShadow='xl'
          />  
          </Box>
        <Container maxW='900px' zIndex={100} px={[2, 4]}>
          <VStack mb='8'>
            <Box id="player" mb='6'></Box>
            <Box width='100%' mb='2'>
              {videoLength && (
                <Box 
                  shadow='sm'
                  mt="-16"
                  borderRadius='full'
                  background='white'
                  border='1px'
                  borderColor='gray.200'
                  pt={8}
                  pb={2}
                  px={12}>
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
                    <RangeSliderTrack bg='gray.200' h={2}>
                      <RangeSliderFilledTrack bg='black' />
                    </RangeSliderTrack>
                    <RangeSliderThumb
                      boxSize={10}
                      index={0}
                      bg='white'
                      border='1px'
                      borderColor='black'
                      onSelect={() => {
                        setIsStartTimeHeaderActive(true);
                        setIsEndTimeHeaderActive(false);
                      }}
                      >
                        <DragHandleIcon color='black'/>
                        <RangeSliderMark fontSize='md' fontWeight='bold' mt='-16'>
                        {formatSecondsToDuration(sliderValue[0])}
                      </RangeSliderMark>
                    </RangeSliderThumb>
                    <RangeSliderThumb
                      boxSize={10}
                      index={1}
                      bg='white'
                      border='1px'
                      borderColor='black'
                      onSelect={() => {
                        setIsStartTimeHeaderActive(false);
                        setIsEndTimeHeaderActive(true); 
                      }}
                      >
                      <RangeSliderMark fontSize='md' as="b" mt='-16'>
                      {formatSecondsToDuration(sliderValue[1])}
                    </RangeSliderMark>
                      <DragHandleIcon color='black'/>
                    </RangeSliderThumb>
                  </RangeSlider>
                </Box>
              )}
            </Box>
            <HStack mb='6' justify='center'>
              <Button
                size='lg'
                shadow='sm'
                mx='2'
                bg='white'
                variant='solid'
                border='1px' 
                borderColor='gray.200'
                borderRadius='full'
                aria-label='Play or Pause'
                leftIcon={isPlaying ? <Icon as={PauseIcon} /> : <Icon as={PlayIcon} />}
                onClick={playPauseClick}>
                   {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                size='lg'
                shadow='sm'
                leftIcon={<RepeatIcon />}
                variant='solid'
                bg='white'
                borderRadius='full'
                border='1px' 
                borderColor='gray.200'
                aria-label='Restart Loop'
                icon={<RepeatIcon/>}
                onClick={restartLoop}>
                Restart Loop
              </Button>
            </HStack>
            <PlaybackRateSelector player={player} />
          </VStack>
        </Container>
      </Flex>
      <Footer/>
    </Flex>
  );
};

export default VideoPage;

