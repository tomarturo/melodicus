import React, { useState } from 'react';
import { RadioGroup, Radio, Stack, HStack, Box, AbsoluteCenter, Flex } from "@chakra-ui/react";

function PlaybackRateSelector({ player }) {
    const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const [selectedRate, setSelectedRate] = useState("1"); // Store as string for RadioGroup compatibility

    const handleRadioChange = (value) => {
        const numericValue = parseFloat(value);
        if (player) {
            player.setPlaybackRate(numericValue);
        }
        setSelectedRate(value);
    }

    return (
        <RadioGroup onChange={handleRadioChange} value={selectedRate} name="rate">
            <Flex spacing={-3} borderWidth='1px' bordercolor="gray.200" borderRadius="sm" borderRightWidth='0px'>
                {rates.map((rate) => (
                    <Box 
                    borderRightColor="gray.200" 
                    borderRightWidth="1px" 
                    bg="gray.50"
                    py={2}
                    px={4}>
                        <Radio 
                        size='lg'
                        bg='white' 
                        colorScheme='purple' 
                        key={rate.toString()} 
                        value={rate.toString()}
                        w='100%'
                        h='100%'>
                            {rate}x
                        </Radio>
                    </Box>
                ))}
            </Flex>
        </RadioGroup>
    );
}

export default PlaybackRateSelector;