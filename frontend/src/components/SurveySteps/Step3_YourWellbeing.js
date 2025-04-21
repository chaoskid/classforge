// src/components/SurveySteps/Step3_YourWellbeing.js
import React from 'react';
import {
  Box, Button, FormControl, FormLabel,
  Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, Text, VStack
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

const likertQuestions = [
  '1. Nervous?',
  '2. Hopeless?',
  '3. Restless or fidgety?',
  '4. So depressed that nothing could cheer you up?',
  '5. That everything was an effort?',
  '6. Worthless?'
];

const labels = {
  1: 'None of the time',
  2: 'A little of the time',
  3: 'Some of the time',
  4: 'Most of the time',
  5: 'All the time'
};

const Step3_YourWellbeing = ({ data, updateFormData, onNext, onBack }) => {
  const how_happy_ans = data.how_happy_ans ?? 5;
  return (
    <VStack spacing={6} align="stretch">
      
      <FormControl>
        <FormLabel fontWeight="semibold">How happy are you with your life as a whole?</FormLabel>
        <Slider
          min={0}
          max={10}
          step={1}
          value={how_happy_ans}
          onChange={(val) => updateFormData('how_happy_ans', val)}
        >
          <SliderTrack><SliderFilledTrack /></SliderTrack>
          <SliderThumb />
        </Slider>
        <Text mt={1}>Your answer: {happinessLabels[how_happy_ans]}</Text>
      </FormControl>

      <Text fontSize="md" fontWeight="semibold" color="gray.600" mb={2}>
        During the past 30 days, about how often did you feel ...
      </Text>

      {likertQuestions.map((question, index) => {
        const key = `wellbeing_q${index + 1}`;
        const value = data[key] || 3;
        return (
          <FormControl key={key}>
            <FormLabel fontWeight="semibold">{question}</FormLabel>
            <Slider
              min={1}
              max={5}
              step={1}
              value={value}
              onChange={(val) => updateFormData(key, val)}
            >
              <SliderTrack><SliderFilledTrack /></SliderTrack>
              <SliderThumb />
            </Slider>
            <Text mt={1}>Your answer: {labels[value]}</Text>
          </FormControl>
        );
      })}

      <Box display="flex" justifyContent="space-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button colorScheme="teal" onClick={onNext}>Next</Button>
      </Box>
    </VStack>
  );
};

export default Step3_YourWellbeing;
