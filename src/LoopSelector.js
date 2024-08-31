import React from 'react';
import { Box, Flex, Text, Circle } from '@chakra-ui/react';
import { RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, RangeSliderMark } from '@chakra-ui/react';

const LoopSelector = ({ 
  videoLength, 
  currentTime, 
  startTime, 
  endTime, 
  onRangeChange, 
  onRangeChangeEnd 
}) => {
  const [sliderValue, setSliderValue] = React.useState([startTime, endTime]);

  const formatSecondsToDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const pad = (value) => (value < 10 ? `0${value}` : value);

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    } else {
      return `${pad(minutes)}:${pad(remainingSeconds)}`;
    }
  };

  return (
    <Box mt="-20">
      <Box
        shadow='md'
        borderRadius='full'
        backdropFilter='auto'
        backdropBlur='20px'
        border='1px'
        borderColor='blackAlpha.200'
        pt={8}
        pb={5}
        px={14}
        sx={{ 'background-color': 'rgba(255,255,255,0.65)' }}
      >
        <RangeSlider
          aria-label={['0', videoLength]}
          min={0}
          max={videoLength}
          defaultValue={[startTime, endTime]}
          onChange={(values) => {
            onRangeChange(values);
            setSliderValue(values);
          }}
          onChangeEnd={onRangeChangeEnd}
        >
          <RangeSliderTrack bg='blackAlpha.500' h={2}>
            <RangeSliderFilledTrack bg='blackAlpha.800' />
          </RangeSliderTrack>
          <RangeSliderMark value={currentTime} mt='-4' w="0px">
            <Flex align='center' direction='column' gap='2px'>
              <Box bg='red.500' w='3px' h='32px'></Box>
              <Text fontSize='sm' fontWeight='semibold' color='blackAlpha.700' textAlign='center'>
                {formatSecondsToDuration(currentTime)}
              </Text>
            </Flex>
          </RangeSliderMark>
          {[0, 1].map((index) => (
            <RangeSliderThumb
              key={index}
              index={index}
              h="38px"
              w="2px"
              bg="blackAlpha.800"
              _hover={{ cursor: "ew-resize" }}
              _active={{ cursor: "ew-resize"}}
            >
              <Flex
                role="group"
                position="absolute"
                top="-12px"
                left="50%"
                gap={8}
                transform="translateX(-50%)"
                direction="column"
                align="center"
                justifyContent="space-between"
              >
                <Circle
                  bg="black"
                  borderRadius="full"
                  boxSize="12px"
                  display="flex"
                  alignItems="center"
                  justifyContent="between"
                  _hover={{ cursor: "ew-resize" }}
                  _active={{ cursor: "ew-resize"}}
                >
                </Circle>
                <Text
                  fontSize='sm'
                  fontWeight='bold'
                  mt='1'
                  opacity='0'
                  transition="opacity 0.2s"
                  _groupHover={{ opacity: "1" }}
                  _groupActive={{ opacity: "1" }}
                >
                  {formatSecondsToDuration(sliderValue[index])}
                </Text>
              </Flex>
            </RangeSliderThumb>
          ))}
        </RangeSlider>
      </Box>
    </Box>
  );
};

export default LoopSelector;