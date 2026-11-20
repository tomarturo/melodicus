import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, useToast } from '@chakra-ui/react';
import { roundSeconds } from './utils/formatTime';
import { errorMessage } from './lib/errors';
import { isSaveableLoop } from './features/player/loopLogic';
import { usePlayerController, usePlayerState, useVideoDetails } from './features/player/usePlayer';
import WaveformTimeline from './features/player/timeline/WaveformTimeline';
import { useSectionMutations, useSectionsQuery } from './features/sections/queries';
import { useSectionsRepository } from './features/sections/useSectionsRepository';
import type { Section } from './features/sections/types';
import { useIncomingShare } from './features/sharing/useIncomingShare';
import ImportSharedLoopsDialog from './features/sharing/ImportSharedLoopsDialog';

import VideoLayout from './VideoLayout';
import VideoDisplay from './VideoDisplay';
import VideoControls from './VideoControls';
import SectionNameModal from './SectionNameModal';
import NullVideoPage from './NullVideoPage';

const EMPTY: Section[] = [];

const VideoPage = () => {
  const { videoId } = useParams();
  // The route always supplies an ID; this only guards against a mis-wired route.
  if (!videoId) return <NullVideoPage />;
  // Keyed so that moving to another video starts with fresh state.
  return <VideoPageContent key={videoId} videoId={videoId} />;
};

type NameDialog = { mode: 'create' } | { mode: 'edit'; section: Section } | null;

const VideoPageContent = ({ videoId }: { videoId: string }) => {
  const toast = useToast();
  const { repo } = useSectionsRepository();

  const { controller, hostRef } = usePlayerController(videoId);
  const { isPlaying, duration: videoLength, loop } = usePlayerState(controller);
  const { title: videoTitle, thumbnailUrl: videoThumbnail } = useVideoDetails(videoId, controller);

  const sectionsQuery = useSectionsQuery(videoId);
  const savedSections = sectionsQuery.data ?? EMPTY;
  const { create, rename, remove, importLoops } = useSectionMutations(videoId);
  const video = { videoId, title: videoTitle ?? '' };

  const [nameDialog, setNameDialog] = useState<NameDialog>(null);
  const [nameDraft, setNameDraft] = useState('');
  const incomingShare = useIncomingShare();

  const showError = (title: string, error: unknown) =>
    toast({ title, description: errorMessage(error), status: 'error', duration: 5000 });

  useEffect(() => {
    if (sectionsQuery.error) {
      toast({
        title: 'Could not load your loops',
        description: errorMessage(sectionsQuery.error),
        status: 'error',
        duration: 5000,
      });
    }
  }, [sectionsQuery.error, toast]);

  const handleNewLoop = () => {
    if (!isSaveableLoop(loop)) {
      toast({
        title: 'Invalid loop',
        description: 'Please select a valid loop to save',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    setNameDraft('');
    setNameDialog({ mode: 'create' });
  };

  const handleEditSection = (section: Section) => {
    setNameDraft(section.name ?? '');
    setNameDialog({ mode: 'edit', section });
  };

  const handleDeleteSection = (sectionId: string) => {
    remove.mutate(sectionId, { onError: (error) => showError('Could not delete the loop', error) });
  };

  const closeNameDialog = () => {
    setNameDialog(null);
    setNameDraft('');
  };

  const handleSaveSection = async () => {
    if (!nameDialog) return;
    const name = nameDraft.trim() || null;
    try {
      if (nameDialog.mode === 'edit') {
        await rename.mutateAsync({ sectionId: nameDialog.section.id, name });
      } else {
        // Rounded here so both backends store the same value for the same loop.
        await create.mutateAsync({
          video,
          loop: { name, start_time: roundSeconds(loop.start), end_time: roundSeconds(loop.end) },
        });
      }
      toast({ title: nameDialog.mode === 'edit' ? 'Loop updated!' : 'Loop saved!', status: 'success', duration: 3000 });
      closeNameDialog();
    } catch (error) {
      showError('Error', error);
    }
  };

  const handleImport = async () => {
    if (!incomingShare.loops) return;
    try {
      const added = await importLoops.mutateAsync({ video, loops: incomingShare.loops });
      toast({
        title: added === 0 ? 'You already have these loops' : added === 1 ? '1 loop added' : `${added} loops added`,
        status: 'success',
        duration: 3000,
      });
      incomingShare.dismiss();
    } catch (error) {
      showError('Could not import the loops', error);
    }
  };

  return (
    <VideoLayout>
      <Box ref={hostRef} display="none" />
      <VideoDisplay videoThumbnail={videoThumbnail} />
      {videoLength ? (
        <WaveformTimeline
          controller={controller}
          videoLength={videoLength}
          savedSections={savedSections}
          onJumpToSection={(start, end) => controller.jumpToLoop(start, end)}
          onEditSection={handleEditSection}
          onDeleteSection={handleDeleteSection}
        />
      ) : null}
      <Box>
        <VideoControls
          isPlaying={isPlaying}
          onPlayPause={() => controller.togglePlay()}
          onRestartLoop={() => controller.restartLoop()}
          onPlaybackRateChange={(rate) => controller.setPlaybackRate(rate)}
          onNewLoop={handleNewLoop}
          videoId={videoId}
          savedSections={savedSections}
        />
      </Box>
      <SectionNameModal
        isOpen={nameDialog !== null}
        onClose={closeNameDialog}
        isEditing={nameDialog?.mode === 'edit'}
        sectionName={nameDraft}
        onSectionNameChange={setNameDraft}
        onSave={handleSaveSection}
      />
      {incomingShare.loops && (
        <ImportSharedLoopsDialog
          loops={incomingShare.loops}
          // Supabase requires the song title; localStorage can do without it.
          canImport={repo.kind === 'local' || Boolean(videoTitle)}
          isImporting={importLoops.isPending}
          onImport={handleImport}
          onDismiss={incomingShare.dismiss}
        />
      )}
    </VideoLayout>
  );
};

export default VideoPage;
