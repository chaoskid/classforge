// src/components/SurveySteps/Step1_AboutYou.js
import React from 'react';
import {
  Box, Button, FormControl, FormLabel,
  RadioGroup, Radio, VStack, Slider,
  SliderTrack, SliderFilledTrack, SliderThumb, Text
} from '@chakra-ui/react';

const happinessLabels = {
  0: 'Very unhappy',
  1: 'Unhappy',
  2: 'Quite unhappy',
  3: 'A little unhappy',
  4: 'Neutral',
  5: 'Somewhat happy',
  6: 'Quite happy',
  7: 'Happy',
  8: 'Very happy',
  9: 'Extremely happy',
  10: 'Totally happy'
};

const Step1_AboutYou = ({ data, updateFormData, onNext }) => {
  const happiness = data.happiness ?? 5;

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="md" color="gray.600" mb={2}>
        Let's get started with some personal background:
      </Text>

      <FormControl isRequired>
        <FormLabel fontWeight="semibold">Which language(s) do you speak at home?</FormLabel>
        <RadioGroup
          onChange={(val) => updateFormData('home_language', val)}
          value={data.home_language || ''}
        >
          <VStack align="start">
            <Radio value="english_only">English only</Radio>
            <Radio value="some_english">Some English and another language</Radio>
            <Radio value="non_english">Only a language other than English</Radio>
          </VStack>
        </RadioGroup>
      </FormControl>

      <FormControl>
        <FormLabel fontWeight="semibold">How happy are you with your life as a whole?</FormLabel>
        <Slider
          min={0}
          max={10}
          step={1}
          value={happiness}
          onChange={(val) => updateFormData('happiness', val)}
        >
          <SliderTrack><SliderFilledTrack /></SliderTrack>
          <SliderThumb />
        </Slider>
        <Text mt={1}>Your answer: {happinessLabels[happiness]}</Text>
      </FormControl>

      <Box textAlign="right">
        <Button colorScheme="teal" onClick={onNext} isDisabled={!data.home_language}>
          Next
        </Button>
      </Box>
    </VStack>
  );
};

export default Step1_AboutYou;
