import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Flex, VStack, HStack, Box, Container, Button, useToast, Text, Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
} from '@chakra-ui/react';
import Header from './Header';
import Footer from './Footer';
import VideoDisplay from './VideoDisplay';
import LoopSelector from './LoopSelector';
import PlaybackControls from './PlaybackControls';
import PlaybackRateSelector from './PlaybackRateSelector';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabaseClient';
import { convertDurationToSeconds, formatSecondsToDuration } from './utils/formatTime';
import { createSavedSection, getSavedSections, deleteSavedSection, updateSavedSection } from './utils/sectionsFunctions'

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
  const [videoTitle, setVideoTitle] = useState(null);
  const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
  const { user } = useAuth();
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [savedSongId, setSavedSongId] = useState(null);
  const [savedSections, setSavedSections] = useState([]);
  const [isAddingSectionName, setIsAddingSectionName] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);

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
        const title = data.items[0]?.snippet?.title;

        setVideoLength(totalDuration);
        setEndTime(prevEndTime => (prevEndTime === 0 ? totalDuration : prevEndTime));
        setVideoThumbnail(thumbnailUrl);
        setVideoTitle(title);
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

  useEffect(() => {
    if (user) {
      const checkIfSaved = async () => {
        const { data, error } = await supabase
          .from('saved_songs')
          .select('id')
          .eq('video_id', videoId)
          .eq('user_id', user.id)
          .single();

        if (data) {
          setIsSaved(true);
          setSavedSongId(data.id);
          // Fetch saved sections when we have the saved_song_id
          const { data: sections } = await getSavedSections(supabase, data.id);
          if (sections) {
            setSavedSections(sections);
          }
        } else {
          // Reset states if video is not saved
          setIsSaved(false);
          setSavedSongId(null);
          setSavedSections([]);
        }
      };

      checkIfSaved();
    }
  }, [user, videoId]);

  //Save song

  const handleSaveVideo = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save videos",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      if (isSaved) {
        // Delete the saved video
        const { error } = await supabase
          .from('saved_songs')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsSaved(false);
        setSavedSongId(null);      // Reset saved_song_id
        setSavedSections([]);      // Clear saved sections

        toast({
          title: "Video removed from saved",
          status: "success",
          duration: 3000,
        });
      } else {
        // Save the video
        const { data, error } = await supabase    // Get the returned data
          .from('saved_songs')
          .insert([
            {
              video_id: videoId,
              title: videoTitle,
            }
          ])
          .select()    // Add this to get back the inserted row
          .single();   // We only inserted one row

        if (error) throw error;

        setIsSaved(true);
        setSavedSongId(data.id);   // Set the new saved_song_id

        toast({
          title: "Video saved!",
          description: "You can find this in your saved videos",
          status: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    }
  };

  //save section

  const handleSaveSection = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save sections",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (!savedSongId) {
      toast({
        title: "Save the video first",
        description: "You need to save the video before saving sections",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsAddingSectionName(true);  // Open the modal instead of saving directly
  };

  const saveSectionWithName = async () => {
    try {
      if (isEditingSection) {
        // Update existing section
        const { data, error } = await updateSavedSection(
          supabase,
          editingSectionId,
          { name: newSectionName.trim() || null }
        );

        if (error) throw error;

        // Update the sections list
        setSavedSections(savedSections.map(section =>
          section.id === editingSectionId ? { ...section, name: data.name } : section
        ));
      } else {
        // Create new section (existing code)
        const { data, error } = await createSavedSection(
          supabase,
          {
            saved_song_id: savedSongId,
            start_time: startTime,
            end_time: endTime,
            name: newSectionName.trim() || null
          }
        );

        if (error) throw error;

        setSavedSections([...savedSections, data]);
      }

      // Reset states
      setNewSectionName('');
      setIsEditingSection(false);
      setEditingSectionId(null);
      setIsAddingSectionName(false);

      toast({
        title: isEditingSection ? "Section updated!" : "Section saved!",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error in saveSectionWithName:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    }
  };
  //delete section
  const handleDeleteSection = async (sectionId) => {
    try {
      const { error } = await deleteSavedSection(supabase, sectionId);
      if (error) throw error;

      setSavedSections(savedSections.filter(section => section.id !== sectionId));
      toast({
        title: "Section deleted",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    }
  };

  // edit section name
  const handleEditSection = (section) => {
    setEditingSectionId(section.id);
    setNewSectionName(section.name || '');
    setIsEditingSection(true);
  };

  //jump to section
  const jumpToSection = (startTime, endTime) => {
    if (player) {
      setStartTime(startTime);
      setEndTime(endTime);
      setSliderValue([startTime, endTime]);
      player.seekTo(startTime);
    }
  };


  return (
    <Flex direction='column' minH='100vh' bg='#F5F5F5'>
      <Header />
      <Flex direction="column" flex="1">
        <VideoDisplay videoThumbnail={videoThumbnail} />
        <Container maxW='900px' zIndex={100} px={[0, 0, 10, 0]}>
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
            <Button
              onClick={handleSaveVideo}
              colorScheme={isSaved ? "red" : "blue"}
              isDisabled={!user}
            >
              {!user ? 'Login to Save' : (isSaved ? 'Unsave' : 'Save')}
            </Button>
            <PlaybackControls
              isPlaying={isPlaying}
              playPauseClick={playPauseClick}
              restartLoop={restartLoop}
            />
            <PlaybackRateSelector player={player} />
            <Modal
              isOpen={isAddingSectionName || isEditingSection}
              onClose={() => {
                setIsAddingSectionName(false);
                setIsEditingSection(false);
                setEditingSectionId(null);
                setNewSectionName('');
              }}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>{isEditingSection ? 'Edit Section Name' : 'Name This Section'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Input
                    placeholder="Enter section name (optional)"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        saveSectionWithName();
                      }
                    }}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={saveSectionWithName}>
                    {isEditingSection ? 'Update' : 'Save Section'}
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    setIsAddingSectionName(false);
                    setIsEditingSection(false);
                    setEditingSectionId(null);
                    setNewSectionName('');
                  }}>
                    Cancel
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
            <VStack spacing={4} width="100%" mt={4}>
              <Button
                onClick={handleSaveSection}
                colorScheme="green"
                isDisabled={!user || !isSaved || !startTime || !endTime}
              >
                Save Current Section
              </Button>

              {savedSections.length > 0 && (
                <Box width="100%" p={4} borderRadius="md" backgroundColor="white">
                  <Text fontWeight="bold" mb={2}>Saved Sections:</Text>
                  <VStack spacing={2} align="stretch">
                    {savedSections.map((section) => (
                      <Box
                        key={section.id}
                        p={2}
                        borderWidth={1}
                        borderRadius="md"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Button
                          size="sm"
                          onClick={() => jumpToSection(section.start_time, section.end_time)}
                          colorScheme="blue"
                          flex={1}
                          mr={2}
                        >      <HStack spacing={3} align="center" width="100%">  {/* Added spacing={1} for gap */}
                            {section.name && (
                              <Text fontSize="sm" fontWeight="700">  {/* Increased size and weight */}
                                {section.name}
                              </Text>
                            )}
                            <Text fontSize="xs" color="whiteAlpha.800">  {/* Made time slightly less prominent */}
                              {formatSecondsToDuration(section.start_time)} - {formatSecondsToDuration(section.end_time)}
                            </Text>
                          </HStack>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditSection(section)}
                          colorScheme="gray"
                          mr={2}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeleteSection(section.id)}
                          colorScheme="red"
                        >
                          Delete
                        </Button>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </VStack>
        </Container>
      </Flex>
      <Footer />
    </Flex>
  );
};

export default VideoPage;
