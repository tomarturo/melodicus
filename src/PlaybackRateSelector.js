import React from 'react';
import { Select, HStack, Text, Flex, IconButton } from "@chakra-ui/react";
import { PlusIcon, MinusIcon } from '@heroicons/react/20/solid';
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
      <Flex>
      <IconButton
        variant='filled'
        aria-label='Increase playback rate'
        fontSize='20px'
        icon={<PlusIcon />}
        shadow='md'
        color="black"
        bg="white"
        border='1px'
        borderColor='blackAlpha.200'
        borderRadius='full'
        _hover={{ color: 'white', bg: 'black' }}
      />
      <IconButton
        variant='filled'
        aria-label='Increase playback rate'
        fontSize='20px'
        icon={<MinusIcon />}
        shadow='md'
        color="black"
        bg="white"
        border='1px'
        borderColor='blackAlpha.200'
        borderRadius='full'
        _hover={{ color: 'white', bg: 'black' }}
      />
      </Flex>
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