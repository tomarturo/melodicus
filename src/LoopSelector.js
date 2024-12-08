import React, { useEffect } from 'react';
import { Box, Flex, Text, Circle } from '@chakra-ui/react';
import { RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, RangeSliderMark } from '@chakra-ui/react';
import { convertDurationToSeconds, formatSecondsToDuration } from './utils/formatTime';

const LoopSelector = ({ 
  videoLength, 
  currentTime, 
  startTime, 
  endTime, 
  onRangeChange, 
  onRangeChangeEnd 
}) => {
  const [sliderValue, setSliderValue] = React.useState([startTime, endTime]);
  
  useEffect(() => {
    setSliderValue([startTime, endTime]);
  }, [startTime, endTime]);

  return (
      <Box
        pt={4}
        pb={4}  
        px={8}
        bg="whiteAlpha.900"
        borderBottomRadius="xl"
      >
        <RangeSlider
          aria-label={['0', videoLength]}
          min={0}
          max={videoLength}
          value={[startTime, endTime]}
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
              <Box bg='red.600' w='3px' h='32px'></Box>
              <Text fontSize='xs' color='blackAlpha.700' textAlign='center'>
                {formatSecondsToDuration(currentTime)}
              </Text>
            </Flex>
          </RangeSliderMark>
          {[0, 1].map((index) => (
            <RangeSliderThumb
              key={index}
              index={index}
              h="64px"
              bg="none"
              shadow="none"
              _hover={{ cursor: "ew-resize" }}
              _active={{ cursor: "ew-resize"}}
              _focus={{ border: "transparent", backgroundColor: "transparent"}}
            >
              <Flex
                role="group"
                position="absolute"
                left="50%"
                transform="translateX(-50%)"
                direction="column"
                align="center"
                justifyContent="space-between"
              >
                <Text
                  fontSize='sm'
                  mb="1"
                  fontWeight='bold'
                  opacity='0'
                  color="blackAlpha.900"
                  transition="opacity 0.2s"
                  _groupHover={{ opacity: "1" }}
                  _groupActive={{ opacity: "1" }}
                >
                  {formatSecondsToDuration(sliderValue[index])}
                </Text>
                <Box 
                h="40px" 
                w="2px"
                bg="blackAlpha.800" 
                _groupHover={{ backgroundColor: "blackAlpha.900" }}
                  _groupActive={{ backgroundColory: "blackAlpha.900" }}/>
                <Circle
                  bg="blackAlpha.800"
                  borderRadius="full"
                  boxSize="10px"
                  _hover={{ cursor: "ew-resize" }}
                  _active={{ cursor: "ew-resize"}}
                  _groupHover={{ backgroundColor: "blackAlpha.900" }}
                  _groupActive={{ backgroundColory: "blackAlpha.900" }}
                >
                </Circle>
              </Flex>
            </RangeSliderThumb>
          ))}
        </RangeSlider>
      </Box>
  );
};

export default LoopSelector;