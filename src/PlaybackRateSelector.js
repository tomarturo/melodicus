import {useState, React} from 'react';
import { Select, HStack, IconButton } from "@chakra-ui/react";
import { PlusIcon, MinusIcon } from '@heroicons/react/16/solid';
import { Plus, Minus } from 'lucide-react';
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
        size="sm"
        variant='filled'
        rounded='full'
        bg="blackAlpha.100"
        border="1px"
        color="blackAlpha.800"
        borderColor="blackAlpha.200"
        _hover={{
          boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg: "blackAlpha.200", borderColor: "blackAlpha.700", color: "blackAlpha.900"
        }}
        isDisabled={currentRate === rates[0]}
        onClick={onMinusClick}
        icon={<Minus style={{ width: '20px', height: '20px' }} />}
        aria-label='Increase playback rate'
      />
      <Select
        size="lg"
        variant='filled'
        rounded='full'
        bg="blackAlpha.100"
        border="1px"
        color="blackAlpha.800"
        borderColor="blackAlpha.200"
        _hover={{
          boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg: "blackAlpha.200", borderColor: "blackAlpha.700", color: "blackAlpha.900"
        }}
        value={currentRate.toString()}
        onChange={handleChange}
      >
        {rates.map((rate) => (
          <option key={rate} value={rate}>
            {rate}x
          </option>
        ))}
      </Select>
        <IconButton
          size="sm"
          variant='filled'
          rounded='full'
          bg="blackAlpha.100"
          border="1px"
          color="blackAlpha.800"
          borderColor="blackAlpha.200"
          _hover={{
            boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg: "blackAlpha.200", borderColor: "blackAlpha.700", color: "blackAlpha.900"
          }}
          icon={<Plus style={{ width: '20px', height: '20px' }} />}
          onClick={onPlusClick}
          isDisabled={currentRate === rates[rates.length - 1]}
          aria-label='Increase playback rate'
        />
    </HStack>
  );
}

export default PlaybackRateSelector;