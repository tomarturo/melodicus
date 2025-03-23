import {useState, React} from 'react';
import { Select, HStack, IconButton } from "@chakra-ui/react";
import { PlusIcon, MinusIcon } from '@heroicons/react/16/solid';
function PlaybackRateSelector({ player }) {
  const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const [currentRate, setCurrentRate] = useState(1);

  const handleChange = (event) => {
    const numericValue = parseFloat(event.target.value);
    setCurrentRate(numericValue);
    if (player) {
      player.setPlaybackRate(numericValue);
    }
  };

  const onPlusClick = () => {
    const currentIndex = rates.indexOf(currentRate)
    if (currentIndex < rates.length -1) {
      const newRate = rates[currentIndex + 1];
      setCurrentRate(newRate);
      if (player) {
        player.setPlaybackRate(newRate)
    }   
    }
  };

  const onMinusClick = () => {
    const currentIndex = rates.indexOf(currentRate)
    if (currentIndex > 0) {
      const newRate = rates[currentIndex - 1];
      setCurrentRate(newRate);
      if (player) {
        player.setPlaybackRate(newRate);
      }
    }
  };

  return (
    <HStack 
      maxW='fit-content' pl="5"
      > 
      <IconButton
        variant='filled'
        aria-label='Increase playback rate'
        size="sm"
        icon={<MinusIcon style={{ width: '20px', height: '20px' }} />}
        onClick={onMinusClick}
        isDisabled={currentRate === rates[0]}
        rounded="full"
        bg="blackAlpha.100"
        border="1px"
        color="blackAlpha.800"
        borderColor="blackAlpha.100"
        _hover={{ bg:"blackAlpha.200", borderColor:"blackAlpha.700", border:"2px", color:"blackAlpha.900"}}
      />
      <Select
        value={currentRate.toString()}
        onChange={handleChange}
        size="lg"
        rounded="full"
        bg="blackAlpha.100"
        border="2px"
        color="blackAlpha.800"
        borderColor="blackAlpha.100"
        _hover={{ bg:"blackAlpha.200", borderColor:"blackAlpha.700", border:"2px", color:"blackAlpha.900"}}
      >
        {rates.map((rate) => (
          <option key={rate} value={rate}>
            {rate}x
          </option>
        ))}
      </Select>
        <IconButton
          variant='filled'
          aria-label='Increase playback rate'
          size="sm"
          icon={<PlusIcon style={{ width: '20px', height: '20px' }} />}
          onClick={onPlusClick}
          isDisabled={currentRate === rates[rates.length - 1]}
          rounded="full"
          bg="blackAlpha.100"
          border="1px"
          color="blackAlpha.800"
          borderColor="blackAlpha.100"
          _hover={{ bg:"blackAlpha.200", borderColor:"blackAlpha.700", border:"2px", color:"blackAlpha.900"}}
        />
    </HStack>
  );
}

export default PlaybackRateSelector;