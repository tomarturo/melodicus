import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { PlayIcon, PauseIcon } from '@heroicons/react/20/solid';
import { DragHandleIcon, RepeatIcon } from '@chakra-ui/icons'
import { Text, Flex, IconButton, Icon, HStack, VStack, Box, Heading, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, RangeSliderMark, Container } from '@chakra-ui/react';
import PlaybackRateSelector from './PlaybackRateSelector';

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
            <Text as='b' align='left' fontSize='xs' casing='uppercase' mb='2'>Playback Speed</Text>
            <PlaybackRateSelector player={player} />
          </VStack>
        </Container>
      </Flex>
      <Footer/>
    </Flex>
  );
};

export default VideoPage;

// TODO - REFACTOR WITH INDIVIDUAL COMPONENTS
// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { Flex, Container, VStack, Text, Heading, Box, IconButton, Icon } from '@chakra-ui/react';
// import { PlayIcon, PauseIcon, RepeatIcon } from '@heroicons/react/20/solid';
// import VideoPlayer from './VideoPlayer';
// import PlaybackControls from './PlaybackControls';
// import LoopSelector from './LoopSelector';
// import { convertDurationToSeconds, formatSecondsToDuration } from './Utilities';

// const VideoPage = () => {
//   const { videoId } = useParams();
//   const apiKey = 'YOUR_API_KEY_HERE'; // Replace with your YouTube API key

//   const [videoLength, setVideoLength] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [startTime, setStartTime] = useState(0);
//   const [endTime, setEndTime] = useState(0);

//   useEffect(() => {
//     // Fetch video details and set videoLength here
//     // ...

//   }, [videoId, apiKey]);

//   const onPlayPauseClick = () => {
//     setIsPlaying((prevIsPlaying) => !prevIsPlaying);
//     // Implement play/pause logic using VideoPlayer component
//   };

//   const onRestartLoop = () => {
//     // Implement loop restart logic using VideoPlayer component
//   };

//   const onRangeChange = (values, index) => {
//     // Handle loop range selection
//   };

//   const onRangeChangeEnd = (index) => {
//     // Handle loop range change completion
//   };

//   return (
//     <Flex direction='column' minH='100vh' bg='whiteAlpha.900'>
//       <Flex direction="column" flex="1">
//         <Container>
//           <VStack mb='8'>
//             <VideoPlayer videoId={videoId} apiKey={apiKey} />
//             <LoopSelector
//               videoLength={videoLength}
//               onRangeChange={onRangeChange}
//               onRangeChangeEnd={onRangeChangeEnd}
//             />
//             <PlaybackControls
//               isPlaying={isPlaying}
//               onPlayPauseClick={onPlayPauseClick}
//               onRestartLoop={onRestartLoop}
//             />
//             <Text as='b' align='left' fontSize='xs' casing='uppercase' mb='2'>Playback Speed</Text>
//             {/* Include your PlaybackRateSelector component here */}
//           </VStack>
//         </Container>
//       </Flex>
//     </Flex>
//   );
// };

// export default VideoPage;
