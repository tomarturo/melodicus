import React from 'react';
import { useRadio, useRadioGroup, Box, HStack, Container, Flex } from "@chakra-ui/react";

// Step 1: Create a component that consumes the `useRadio` hook
function RateButton(props) {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as='label'>
      <input {...input} />
      <Flex
        {...checkbox}
        width="80px"
        align="center"
        justify="center"
        cursor='pointer'
        borderWidth='1px'
        borderColor='blackAlpha.200'
        borderRightWidth={props.isLast ? '1px' : '0'}
        borderRightRadius={props.isLast ? 'full' : '0'}
        borderLeftRadius={props.isFirst ? 'full' : '0'}
        _checked={{
          bg: 'black',
          color: 'white',
          borderColor: 'black',
        }}
        py={2}
        fontSize="sm"
        transition="all 0.2s"
      >
        {props.children}
      </Flex>
    </Box>
  );
}

// Step 2: Use the `useRadioGroup` hook to control a group of custom radios
function PlaybackRateSelector({ player }) {
  const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const handleChange = (value) => {
    const numericValue = parseFloat(value);
    if (player) {
      player.setPlaybackRate(numericValue);
    }
  };

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'playbackRate',
    defaultValue: '1',
    onChange: handleChange,
  });

  const group = getRootProps();

  return (
    <Container maxW='fit-content' overflowX='auto' height="64px">
      <HStack {...group} spacing={0} borderRadius="full" bg='white' shadow='sm'
        backdropFilter='auto'
        backdropBlur='20px'>
        {rates.map((rate, index) => {
          const value = rate.toString();
          const radio = getRadioProps({ value });
          const isLast = index === rates.length - 1;
          const isFirst = index === 0;

          return (
            <RateButton key={value} {...radio} isLast={isLast} isFirst={isFirst}>
              {rate}x
            </RateButton>
          );
        })}
      </HStack>
    </Container>
  );
}

export default PlaybackRateSelector;