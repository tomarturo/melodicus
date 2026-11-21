import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { Trash } from '@phosphor-icons/react';
import { roundSeconds } from './utils/formatTime';
import { errorCause } from './lib/errors';
import { useNotify } from './lib/notify';
import { isSaveableLoop } from './features/player/loopLogic';
import { usePlayerController, usePlayerState, useVideoDetails } from './features/player/usePlayer';
import WaveformTimeline from './features/player/timeline/WaveformTimeline';
import { useSectionMutations, useSectionsQuery } from './features/sections/queries';
import { useSectionsRepository } from './features/sections/useSectionsRepository';
import type { Section } from './features/sections/types';
import { useIncomingShare } from './features/sharing/useIncomingShare';
import ImportSharedLoopsDialog from './features/sharing/ImportSharedLoopsDialog';
import ShareButton from './features/sharing/ShareButton';

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
  const notify = useNotify();
  const { repo } = useSectionsRepository();

  const { controller, hostRef } = usePlayerController(videoId);
  const { isPlaying, duration: videoLength, loop, playbackRate } = usePlayerState(controller);
  const { title: videoTitle, thumbnailUrl: videoThumbnail } = useVideoDetails(videoId, controller);

  const sectionsQuery = useSectionsQuery(videoId);
  const savedSections = sectionsQuery.data ?? EMPTY;
  const { create, rename, retime, remove, importLoops } = useSectionMutations(videoId);
  const video = { videoId, title: videoTitle ?? '' };

  const [nameDialog, setNameDialog] = useState<NameDialog>(null);
  const [nameDraft, setNameDraft] = useState('');
  // Set synchronously, so a second tap that lands before React re-renders the
  // button as disabled is still ignored rather than saving the loop twice.
  const isSavingRef = useRef(false);
  const incomingShare = useIncomingShare();

  const showError = (title: string, error: unknown, retry?: () => void) =>
    notify({
      tone: 'error',
      title,
      description: errorCause(error),
      action: retry ? { label: 'Try again', onClick: retry } : undefined,
    });

  const { error: loadError, refetch: refetchSections } = sectionsQuery;
  useEffect(() => {
    if (loadError) showError('Couldn’t load your loops', loadError, () => void refetchSections());
    // Once per failure, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError]);

  const handleNewLoop = () => {
    if (!isSaveableLoop(loop)) {
      notify({ tone: 'warning', title: 'Drag on the track to pick a loop first' });
      return;
    }
    setNameDraft('');
    setNameDialog({ mode: 'create' });
  };

  const handleEditSection = (section: Section) => {
    setNameDraft(section.name ?? '');
    setNameDialog({ mode: 'edit', section });
  };

  // Deletes straight away; Undo saves the loop again with the same name and times.
  const handleDeleteSection = (sectionId: string) => {
    const section = savedSections.find((candidate) => candidate.id === sectionId);
    remove.mutate(sectionId, {
      onSuccess: () => {
        if (!section) return;
        notify({
          title: `Deleted “${section.name || 'Unnamed'}”`,
          icon: { as: Trash, color: 'white' },
          duration: 5000,
          action: { label: 'Undo', onClick: () => restoreSection(section) },
        });
      },
      onError: (error) => showError('Couldn’t delete the loop', error, () => handleDeleteSection(sectionId)),
    });
  };

  const restoreSection = (section: Section) => {
    create.mutate(
      { video, loop: { name: section.name, start_time: section.start_time, end_time: section.end_time } },
      { onError: (error) => showError('Couldn’t bring the loop back', error, () => restoreSection(section)) },
    );
  };

  const closeNameDialog = () => {
    setNameDialog(null);
    setNameDraft('');
  };

  const handleSaveSection = async () => {
    if (!nameDialog || isSavingRef.current) return;
    isSavingRef.current = true;
    const name = nameDraft.trim() || null;
    try {
      if (nameDialog.mode === 'edit') {
        await rename.mutateAsync({ sectionId: nameDialog.section.id, name });
      } else {
        // Rounded here so both backends store the same value for the same loop.
        const created = await create.mutateAsync({
          video,
          loop: { name, start_time: roundSeconds(loop.start), end_time: roundSeconds(loop.end) },
        });
        // Dragging this loop's edges from now on offers to update it.
        controller.setLoopOrigin(created.id);
      }
      // A new loop shows up as its pill; a rename only changes a label, so say so.
      if (nameDialog.mode === 'edit') notify({ tone: 'success', title: 'Loop renamed' });
      closeNameDialog();
    } catch (error) {
      // The dialog stays open, so its button is the way to try again.
      showError(nameDialog.mode === 'edit' ? 'Couldn’t rename the loop' : 'Couldn’t save the loop', error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleUpdateLoop = async (section: Section) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      await retime.mutateAsync({
        sectionId: section.id,
        times: { start_time: roundSeconds(loop.start), end_time: roundSeconds(loop.end) },
      });
      notify({ tone: 'success', title: `“${section.name || 'Unnamed'}” updated` });
    } catch (error) {
      showError('Couldn’t update the loop', error, () => void handleUpdateLoop(section));
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleImport = async () => {
    if (!incomingShare.loops) return;
    try {
      const added = await importLoops.mutateAsync({ video, loops: incomingShare.loops });
      notify({
        tone: 'success',
        title: added === 0 ? 'You already have these loops' : added === 1 ? '1 loop added' : `${added} loops added`,
      });
      incomingShare.dismiss();
    } catch (error) {
      // The import dialog stays open, so its button is the way to try again.
      showError('Couldn’t import the loops', error);
    }
  };

  return (
    // One panel holds the video area, timeline and controls. It fills the
    // space the frame leaves; the video area flexes to fit, and on a window too
    // short for even its minimum, the panel scrolls inside itself.
    <Flex
      direction="column"
      flex="1"
      minH="0"
      bg="bg.panel"
      borderRadius={['none', 'none', 'xl']}
      overflowX="hidden"
      overflowY="auto"
      overscrollBehavior="contain"
    >
      <Box ref={hostRef} display="none" />
      <VideoDisplay videoThumbnail={videoThumbnail}>
        <Box position="absolute" top={3} right={3} zIndex={1}>
          <ShareButton videoId={videoId} savedSections={savedSections} />
        </Box>
      </VideoDisplay>
      {videoLength ? (
        <WaveformTimeline
          controller={controller}
          videoLength={videoLength}
          savedSections={savedSections}
          onEditSection={handleEditSection}
          onDeleteSection={handleDeleteSection}
          onSaveLoop={handleNewLoop}
          onUpdateLoop={handleUpdateLoop}
          isSavingLoop={create.isPending || retime.isPending}
        />
      ) : null}
      <Box flexShrink={0}>
        <VideoControls
          isPlaying={isPlaying}
          playbackRate={playbackRate}
          onPlayPause={() => controller.togglePlay()}
          onRestartLoop={() => controller.restartLoop()}
          onPlaybackRateChange={(rate) => controller.setPlaybackRate(rate)}
        />
      </Box>
      <SectionNameModal
        isOpen={nameDialog !== null}
        onClose={closeNameDialog}
        isEditing={nameDialog?.mode === 'edit'}
        sectionName={nameDraft}
        onSectionNameChange={setNameDraft}
        onSave={handleSaveSection}
        isSaving={create.isPending || rename.isPending}
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
    </Flex>
  );
};

export default VideoPage;
