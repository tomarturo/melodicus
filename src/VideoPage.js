import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, useToast } from '@chakra-ui/react';
import { useAuth } from './contexts/AuthContext';
// Custom Hooks
import useYouTubePlayer from './hooks/useYouTubePlayer';
import useLoopManager from './hooks/useLoopManager';
import useSections from './hooks/useSections';
import useSharingUrl from './hooks/useSharingUrl';

// Components
import VideoLayout from './VideoLayout'
import VideoDisplay from './VideoDisplay';
import VideoControls from './VideoControls';
import LoopSelector from './LoopSelector';
import SectionNameModal from './SectionNameModal';

const VideoPage = () => {
  const { videoId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;

  // Process URL parameters first for timestamp sharing
  const { hasSectionsInUrl, isLoading, importSectionsFromUrl, hasImported } = useSharingUrl(videoId);

  // Initialize hooks
  const {
    player,
    isPlaying,
    currentTime,
    videoLength,
    videoTitle,
    videoThumbnail,
    controls
  } = useYouTubePlayer(videoId, apiKey);

  const {
    startTime,
    endTime,
    handleRangeChange,
    handleRangeChangeEnd,
    jumpToSection
  } = useLoopManager(videoLength, currentTime, { ...controls, player });

  const {
    savedSections,
    isAddingSectionName,
    isEditingSection,
    newSectionName,
    setIsAddingSectionName,
    setNewSectionName,
    saveSection,
    updateSection,
    deleteSection,
    startEditingSection,
    setSavedSections,
    reloadSections
  } = useSections(videoId, user, videoTitle);

  // Apply loaded sections from URL if available
  useEffect(() => {
    console.log('VideoPage useEffect - isLoading:', isLoading, 'hasSectionsInUrl:', hasSectionsInUrl, 'hasImported:', hasImported);
    
    if (!isLoading && hasSectionsInUrl && !hasImported) {
      console.log('Attempting to import sections from URL...');
      
      // Import sections from URL and then reload the local sections hook
      const success = importSectionsFromUrl();
      
      console.log('importSectionsFromUrl success:', success);
      
      if (success) {
        // Trigger useLocalSections to reload from localStorage
        reloadSections();
      }
    }
  }, [hasSectionsInUrl, isLoading, importSectionsFromUrl, reloadSections, hasImported]);

  // Add direct loop checking here
  useEffect(() => {
    if (!player) return;

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
      }
    };

    if (player.getPlayerState) {
      const setupInterval = () => {
        if (player.getPlayerState() !== -1) {
          intervalId = setInterval(checkProgress, 250);
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
  }, [player, startTime, endTime]);

  // Event handlers
  const handlePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleNewLoop = () => {
    if (startTime === endTime) {
      toast({
        title: "Invalid loop",
        description: "Please select a valid loop to save",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setIsAddingSectionName(true);
  };

  const handleSaveSection = async () => {
    try {
      if (isEditingSection) {
        await updateSection();
      } else {
        await saveSection(startTime, endTime);
      }

      toast({
        title: isEditingSection ? "Loop updated!" : "Loop saved!",
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

  return (
    <VideoLayout
      videoLength={videoLength}
      savedSections={savedSections}
      onJumpToSection={jumpToSection}
      onEditSection={startEditingSection}
      onDeleteSection={deleteSection}
    >
      <Box id="player" display="none" />
      <VideoDisplay
        videoThumbnail={videoThumbnail}
        videoLength={videoLength}
        savedSections={savedSections}
        onJumpToSection={jumpToSection}
        onEditSection={startEditingSection}
        onDeleteSection={deleteSection}
      />
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
      <Box>
        <VideoControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onRestartLoop={() => player && player.seekTo(startTime, true)}
          player={player}
          onNewLoop={handleNewLoop}
          canSaveLoop={startTime !== endTime}
          videoId={videoId}
          savedSections={savedSections}
        />
      </Box>
      <SectionNameModal
        isOpen={isAddingSectionName}
        onClose={() => {
          setIsAddingSectionName(false);
          setNewSectionName('');
        }}
        isEditing={isEditingSection}
        sectionName={newSectionName}
        onSectionNameChange={setNewSectionName}
        onSave={handleSaveSection}
      />
    </VideoLayout>
  );
};

export default VideoPage;