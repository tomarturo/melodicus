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
        borderColor='gray.200'
        pt={8}
        pb={4}
        px={12}
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
          <RangeSliderTrack bg='blackAlpha.300' h={2}>
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
              h="32px"
              w="2px"
              bg="blackAlpha.800"
              _focus={{ boxShadow: "none" }}
              _active={{ bg: "blackAlpha.900" }}
            >
              <Flex
                role="group"
                position="absolute"
                top="-20px"
                left="50%"
                transform="translateX(-50%)"
                direction="column"
                align="center"
              >
                <Box
                  as="button"
                  bg="white"
                  borderRadius="full"
                  boxSize="24px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="md"
                  border="1px"
                  borderColor="blackAlpha.200"
                  _hover={{ bg: "purple.50" }}
                  _active={{ bg: "purple.100" }}
                >
                  <Circle size='16px' bg='black' color="black" border="0px" />
                </Box>
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