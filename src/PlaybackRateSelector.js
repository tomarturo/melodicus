import React from 'react';
import { Select, HStack, Text } from "@chakra-ui/react";

function PlaybackRateSelector({ player }) {
  const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const handleChange = (event) => {
    const numericValue = parseFloat(event.target.value);
    if (player) {
      player.setPlaybackRate(numericValue);
    }
  };

  return (
    <HStack maxW='fit-content'>
      <Text size="sm" color="white">Playback speed</Text>
      <Select
        defaultValue="1"
        onChange={handleChange}
        width="100px"
        size="lg"
        borderRadius="full"
        bg="white"
        borderColor="blackAlpha.200"
        _hover={{ borderColor: 'blackAlpha.300' }}
        _focus={{ borderColor: 'black', boxShadow: 'none' }}
      >
        Playback Rate
        {rates.map((rate) => (
          <option key={rate} value={rate}>
            {rate}x
          </option>
        ))}
      </Select>
    </HStack>
  );
}

export default PlaybackRateSelector;