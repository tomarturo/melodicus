import React, { useState } from 'react';
import { RadioGroup, Radio, Box, Container, Flex } from "@chakra-ui/react";

function PlaybackRateSelector({ player }) {
    const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const [selectedRate, setSelectedRate] = useState("1");

    const handleRadioChange = (value) => {
        const numericValue = parseFloat(value);
        if (player) {
            player.setPlaybackRate(numericValue);
        }
        setSelectedRate(value);
    }

    return (
        <Container maxW='fit-content' overflowX='auto' borderWidth='1px' bordercolor="gray.200" borderRadius="full" bg='white' shadow='sm' alignContent='center'>
            <RadioGroup onChange={handleRadioChange} value={selectedRate} name="rate">
                <Flex spacing={-4}>
                    {rates.map((rate) => (
                        <Box
                          maxW='100%'
                          key={rate.toString()}
                          borderRightColor="gray.200"
                          borderRightWidth="1px"
                          py={2}
                          px={2}
                          _last={{borderRight:'none'}}>
                          <Radio
                            size='md'
                            colorScheme='blackAlpha'
                            key={rate.toString()}
                            value={rate.toString()}
                            w='100%'
                            h='100%'
                            >
                            {rate}x
                        </Radio>
                        </Box>
                    ))}
                </Flex>
            </RadioGroup>
        </Container>
    );
}

export default PlaybackRateSelector;