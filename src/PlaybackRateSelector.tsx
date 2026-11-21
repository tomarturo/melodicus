import { useState, type ChangeEvent } from 'react';
import { Select, HStack, IconButton } from "@chakra-ui/react";
import { Plus, Minus } from '@phosphor-icons/react';
function PlaybackRateSelector({ onRateChange }: { onRateChange: (rate: number) => void }) {
  const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const [currentRate, setCurrentRate] = useState(1);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const numericValue = parseFloat(event.target.value);
    setCurrentRate(numericValue);
    onRateChange(numericValue);
  };

  const onPlusClick = () => {
    const currentIndex = rates.indexOf(currentRate)
    if (currentIndex < rates.length -1) {
      const newRate = rates[currentIndex + 1];
      setCurrentRate(newRate);
      onRateChange(newRate);   
    }
  };

  const onMinusClick = () => {
    const currentIndex = rates.indexOf(currentRate)
    if (currentIndex > 0) {
      const newRate = rates[currentIndex - 1];
      setCurrentRate(newRate);
      onRateChange(newRate);
    }
  };

  return (
    <HStack 
      maxW='fit-content'
      > 
      <IconButton
        size="sm"
        variant='pill'
        isDisabled={currentRate === rates[0]}
        onClick={onMinusClick}
        icon={<Minus size={20} />}
        aria-label='Increase playback rate'
      />
      <Select
        size="lg"
        variant='filled'
        rounded='full'
        bg="bg.muted"
        border="1px"
        color="fg.default"
        borderColor="border.default"
        minW="100px" 
        _hover={{
          boxShadow: "0 0 0 1px", boxShadowColor: "fg.default", bg: "bg.mutedHover", borderColor: "border.emphasis", color: "fg.strong"
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
          variant='pill'
          icon={<Plus size={20} />}
          onClick={onPlusClick}
          isDisabled={currentRate === rates[rates.length - 1]}
          aria-label='Increase playback rate'
        />
    </HStack>
  );
}

export default PlaybackRateSelector;