import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, useToast } from '@chakra-ui/react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabaseClient';

// Custom Hooks
import useYouTubePlayer from './hooks/useYouTubePlayer';
import useLoopManager from './hooks/useLoopManager';
import useSavedSections from './hooks/useSavedSections';

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
    sliderValue,
    handleRangeChange,
    handleRangeChangeEnd,
    jumpToSection
  } = useLoopManager(videoLength, currentTime, controls);

  const {
    isSaved,
    savedSections,
    isAddingSectionName,
    isEditingSection,
    newSectionName,
    setIsAddingSectionName,
    setNewSectionName,
    handleSaveVideo,
    saveSection,
    updateSection,
    deleteSection
  } = useSavedSections(supabase, videoId, user, videoTitle);

  // Event handlers
  const handlePlayPause = () => {
    if (isPlaying) {
      controls.pause();
    } else {
      controls.play();
    }
  };

  const handleNewLoop = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save sections",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (!isSaved) {
      toast({
        title: "Save the video first",
        description: "You need to save the video before saving sections",
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
        title: isEditingSection ? "Section updated!" : "Section saved!",
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
      onEditSection={(section) => {
        setNewSectionName(section.name || '');
        setIsAddingSectionName(true);
      }}
      onDeleteSection={deleteSection}
    >
      <Box id="player" display="none" />
      <VideoDisplay
        videoThumbnail={videoThumbnail}
        videoLength={videoLength}
        savedSections={savedSections}
        onJumpToSection={jumpToSection}
        onEditSection={(section) => {
          setNewSectionName(section.name || '');
          setIsAddingSectionName(true);
        }}
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
      <Box px={2} marginTop={4}>
        <VideoControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onRestartLoop={() => controls.seekTo(startTime)}
          player={player}
          onNewLoop={handleNewLoop}
          onSaveVideo={handleSaveVideo}
          isUserLoggedIn={!!user}
          isSaved={isSaved}
          canSaveLoop={startTime !== endTime}
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