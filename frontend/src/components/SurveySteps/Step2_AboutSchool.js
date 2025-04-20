// src/components/SurveySteps/Step2_AboutSchool.js
import React from 'react';
import {
  Box, Button, FormControl, FormLabel,
  Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, Text, VStack
} from '@chakra-ui/react';

const questions = [
  'I feel comfortable at school.',
  'At school, I feel isolated because of my opinions.',
  'When someone criticises the school, it feels like a personal insult.',
  'At school, my opinion doesn’t count for much.',
  'At this school, bullying is not tolerated at all.',
  'I believe that what I learn at school will help me in my future.'
];

const labels = {
  1: 'Strongly disagree',
  2: 'Disagree',
  3: 'Somewhat disagree',
  4: 'Neutral',
  5: 'Somewhat agree',
  6: 'Agree',
  7: 'Strongly agree'
};

const Step2_AboutSchool = ({ data, updateFormData, onNext, onBack }) => {
  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="md" color="gray.600" mb={2}>
        Please answer the following questions about your experience at school:
      </Text>

      {questions.map((question, index) => {
        const key = `school_q${index + 1}`;
        const value = data[key] || 4;
        return (
          <FormControl key={key}>
            <FormLabel fontWeight="semibold">{question}</FormLabel>
            <Slider
              min={1}
              max={7}
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

export default Step2_AboutSchool;
