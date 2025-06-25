import React from 'react';
import { Flex, HStack, Button, Icon } from '@chakra-ui/react';
import PlaybackControls from './PlaybackControls';
import PlaybackRateSelector from './PlaybackRateSelector';
import ShareTimestamps from './ShareTimestamps';
import { CirclePlus } from 'lucide-react';

const VideoControls = ({
  isPlaying,
  onPlayPause,
  onRestartLoop,
  player,
  onNewLoop,
  canSaveLoop,
  videoId,
  savedSections,
}) => (
<Flex 
    direction="column"
    bg='#FAF9F6' 
    pt={4} 
    pb={8} 
    px={["12px", "12px", 8]} 
    borderBottomRadius={["0", "0", "xl"]}
    gap={3}
>
    {/* 320px+ and 480px+: Play/Restart row */}
    <Flex 
        display={["flex", "flex", "none"]} // Hide on tablet+ 
        gap={3}
    >
        <PlaybackControls
            isPlaying={isPlaying}
            playPauseClick={onPlayPause}
            restartLoop={onRestartLoop}
            flex="1"
        />
    </Flex>

    {/* 320px+ and 480px+: Speed control row */}
    <Flex 
        display={["flex", "flex", "none"]} // Hide on tablet+
        justifyContent="center"
    >
        <PlaybackRateSelector player={player} />
    </Flex>

    {/* 320px+ and 480px+: Add Loop/Save row */}
    <Flex 
        display={["flex", "flex", "none"]} // Hide on tablet+
        gap={3}
        justify="center"
    >
      <ShareTimestamps 
            videoId={videoId} 
            savedSections={savedSections}
            flex="1"
        />
        <Button
            onClick={onNewLoop}
            leftIcon={<Icon as={CirclePlus} w="20px" h="20px" />}
            variant='filled'
            size='lg'
            rounded='full'
            bg="blackAlpha.100"
            border="1px"
            color="blackAlpha.800"
            borderColor="blackAlpha.200"
            _hover={{ 
                boxShadow: "0 0 0 1px", 
                boxShadowColor: "blackAlpha.800", 
                bg:"blackAlpha.200", 
                borderColor:"blackAlpha.700", 
                color:"blackAlpha.900"
            }}
            aria-label='Add loop'
        >
            Add loop
        </Button>
    </Flex>

    {/* 768px+: Two-column layout */}
<Flex 
    display={["none", "none", "flex", "none"]} // Show only on tablet
    justify="space-between"
    align="start"
>
    {/* Left column: Play/Restart and Speed control - fixed width */}
    <Flex 
        direction="column" 
        gap={3} 
        justify="center"
        width="fit-content" // Or set to the exact width of Play+Restart buttons
    >
        <PlaybackControls
            isPlaying={isPlaying}
            playPauseClick={onPlayPause}
            restartLoop={onRestartLoop}
        />
        <Flex justify="center">
            <PlaybackRateSelector player={player} />
        </Flex>
    </Flex>
    
    {/* Right column: Add Loop and Save */}
    <Flex 
        direction="column" 
        gap={3} 
        align="flex-end"
    >
        <Button
            onClick={onNewLoop}
            leftIcon={<Icon as={CirclePlus} w="20px" h="20px" />}
            variant='filled'
            size='lg'
            rounded='full'
            bg="blackAlpha.100"
            border="1px"
            color="blackAlpha.800"
            borderColor="blackAlpha.200"
            _hover={{ 
                boxShadow: "0 0 0 1px", 
                boxShadowColor: "blackAlpha.800", 
                bg:"blackAlpha.200", 
                borderColor:"blackAlpha.700", 
                color:"blackAlpha.900"
            }}
            aria-label='Add loop'
        >
            Add loop
        </Button>
        <ShareTimestamps videoId={videoId} savedSections={savedSections} />
    </Flex>
</Flex>

    {/* 992px+: Single row layout */}
    <Flex 
        display={["none", "none", "none", "flex"]} // Show only on desktop+
        justify="space-between"
        align="center"
        gap={6}
    >
        <Flex gap={3} align="center">
            <PlaybackControls
                isPlaying={isPlaying}
                playPauseClick={onPlayPause}
                restartLoop={onRestartLoop}
            />
            <PlaybackRateSelector player={player} />
        </Flex>
        <Flex gap={3} align="center">
            <Button
                onClick={onNewLoop}
                leftIcon={<Icon as={CirclePlus} w="20px" h="20px" />}
                variant='filled'
                size='lg'
                rounded='full'
                bg="blackAlpha.100"
                border="1px"
                color="blackAlpha.800"
                borderColor="blackAlpha.200"
                _hover={{ 
                    boxShadow: "0 0 0 1px", 
                    boxShadowColor: "blackAlpha.800", 
                    bg:"blackAlpha.200", 
                    borderColor:"blackAlpha.700", 
                    color:"blackAlpha.900"
                }}
                aria-label='Add loop'
            >
                Add loop
            </Button>
            <ShareTimestamps videoId={videoId} savedSections={savedSections} />
        </Flex>
    </Flex>
</Flex>
);

export default VideoControls;