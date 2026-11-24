import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Flex, HStack, Icon } from '@chakra-ui/react';
import { MusicNotes, Trash } from '@phosphor-icons/react';
import { roundSeconds } from './utils/formatTime';
import { errorCause } from './lib/errors';
import { useNotify } from './lib/notify';
import { isSaveableLoop } from './features/player/loopLogic';
import { usePlayerController, usePlayerState, useVideoDetails } from './features/player/usePlayer';
import WaveformTimeline from './features/player/timeline/WaveformTimeline';
import { useSectionMutations, useSectionsQuery } from './features/sections/queries';
import { useSectionsRepository } from './features/sections/useSectionsRepository';
import { isSameLoop, withoutDuplicates, type NewSection, type Section } from './features/sections/types';
import { useIncomingShare } from './features/sharing/useIncomingShare';
import ShareButton from './features/sharing/ShareButton';

import VideoDisplay from './VideoDisplay';
import VideoControls from './VideoControls';
import SectionNameModal from './SectionNameModal';
import NullVideoPage from './NullVideoPage';

const EMPTY: Section[] = [];
// Marks the ids of loops from a share link that aren't saved yet.
const LINK_LOOP_PREFIX = 'from-link-';

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

  // Loops a share link brought that this song hasn't saved yet. They show and
  // play like saved loops; the first change to any of them (or a new loop, or
  // Save song) saves the song with all of them. Ids mark them until then.
  const linkLoops = useMemo(
    () => (incomingShare.loops ? withoutDuplicates(savedSections, incomingShare.loops) : []),
    [incomingShare.loops, savedSections],
  );
  const sections = useMemo(
    () => [...savedSections, ...linkLoops.map((loop, index) => ({ ...loop, id: `${LINK_LOOP_PREFIX}${index}` }))],
    [savedSections, linkLoops],
  );
  const linkLoopIndex = (sectionId: string) =>
    sectionId.startsWith(LINK_LOOP_PREFIX) ? Number(sectionId.slice(LINK_LOOP_PREFIX.length)) : -1;
  const isSavingSong = useRef(false);

  /**
   * Saves the song with the link's loops, as given (already renamed, moved or
   * without a deleted one), then lets the saved loops take their place.
   */
  const saveSongWith = async (loops: NewSection[]) => {
    // Supabase stores the song's title; until it has loaded there's nothing to save it under.
    if (repo.kind !== 'local' && !videoTitle) throw new Error('The video is still loading. Try again in a moment.');
    await importLoops.mutateAsync({ video, loops });
    incomingShare.dismiss();
  };

  /** After saving, points the selection at the saved copy of a loop, so editing it offers Update. */
  const selectSaved = async (times: NewSection) => {
    const { data } = await refetchSections();
    const saved = data?.find((section) => isSameLoop(section, times));
    if (saved) controller.setLoopOrigin(saved.id);
  };

  const handleSaveSong = async () => {
    if (isSavingSong.current) return;
    isSavingSong.current = true;
    try {
      await saveSongWith(linkLoops);
      notify({ tone: 'success', title: 'Saved to My songs' });
    } catch (error) {
      showError('Couldn’t save the song', error, () => void handleSaveSong());
    } finally {
      isSavingSong.current = false;
    }
  };


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
    const section = sections.find((candidate) => candidate.id === sectionId);
    const linkIndex = linkLoopIndex(sectionId);
    if (linkIndex >= 0) {
      // A change to the link's loops: save the song with the rest of them.
      saveSongWith(linkLoops.filter((_, index) => index !== linkIndex)).then(
        () => section && notifyDeleted(section),
        (error) => showError('Couldn’t delete the loop', error, () => handleDeleteSection(sectionId)),
      );
      return;
    }
    remove.mutate(sectionId, {
      onSuccess: () => section && notifyDeleted(section),
      onError: (error) => showError('Couldn’t delete the loop', error, () => handleDeleteSection(sectionId)),
    });
  };

  const notifyDeleted = (section: Section) =>
    notify({
      title: `Deleted “${section.name || 'Unnamed'}”`,
      icon: { as: Trash, color: 'white' },
      duration: 5000,
      action: { label: 'Undo', onClick: () => restoreSection(section) },
    });

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
      const linkIndex = nameDialog.mode === 'edit' ? linkLoopIndex(nameDialog.section.id) : -1;
      if (nameDialog.mode === 'edit' && linkIndex >= 0) {
        // Renaming one of the link's loops saves the song, with it renamed.
        await saveSongWith(linkLoops.map((linkLoop, index) => (index === linkIndex ? { ...linkLoop, name } : linkLoop)));
      } else if (nameDialog.mode === 'edit') {
        await rename.mutateAsync({ sectionId: nameDialog.section.id, name });
      } else {
        // Rounded here so both backends store the same value for the same loop.
        const newLoop = { name, start_time: roundSeconds(loop.start), end_time: roundSeconds(loop.end) };
        if (linkLoops.length > 0) {
          // A new loop on a song from a link saves the song: the link's loops and this one.
          await saveSongWith([...linkLoops, newLoop]);
          await selectSaved(newLoop);
        } else {
          const created = await create.mutateAsync({ video, loop: newLoop });
          // Dragging this loop's edges from now on offers to update it.
          controller.setLoopOrigin(created.id);
        }
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
      const times = { start_time: roundSeconds(loop.start), end_time: roundSeconds(loop.end) };
      const linkIndex = linkLoopIndex(section.id);
      if (linkIndex >= 0) {
        // Moving one of the link's loops saves the song, with it moved.
        await saveSongWith(linkLoops.map((linkLoop, index) => (index === linkIndex ? { ...linkLoop, ...times } : linkLoop)));
        await selectSaved({ name: section.name, ...times });
      } else {
        await retime.mutateAsync({ sectionId: section.id, times });
      }
      notify({ tone: 'success', title: `“${section.name || 'Unnamed'}” updated` });
    } catch (error) {
      showError('Couldn’t update the loop', error, () => void handleUpdateLoop(section));
    } finally {
      isSavingRef.current = false;
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
        <HStack position="absolute" top={3} right={3} zIndex={1} spacing={2}>
          {/* Only while the song shows loops from a link that aren't saved yet. */}
          {linkLoops.length > 0 && (
            // The theme's sm size: 32px, the Share button's height.
            <Button
              variant="loud"
              size="sm"
              leftIcon={<Icon as={MusicNotes} boxSize="16px" />}
              isLoading={importLoops.isPending}
              loadingText="Saving"
              onClick={() => void handleSaveSong()}
            >
              Save song
            </Button>
          )}
          <ShareButton videoId={videoId} savedSections={sections} />
        </HStack>
      </VideoDisplay>
      {videoLength ? (
        <WaveformTimeline
          controller={controller}
          videoLength={videoLength}
          savedSections={sections}
          onEditSection={handleEditSection}
          onDeleteSection={handleDeleteSection}
          onSaveLoop={handleNewLoop}
          onUpdateLoop={handleUpdateLoop}
          isSavingLoop={create.isPending || retime.isPending || importLoops.isPending}
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
        isSaving={create.isPending || rename.isPending || importLoops.isPending}
      />
    </Flex>
  );
};

export default VideoPage;
