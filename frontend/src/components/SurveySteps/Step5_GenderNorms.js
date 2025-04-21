// src/components/SurveySteps/Step1_GenderNorms.js
import React from 'react';
import {
  Box, Button, FormControl, FormLabel,
  Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, Text, VStack
} from '@chakra-ui/react';

const questions = [
  'A man shouldn\'t have to do household chores.',
  'Men should use violence to get respect if necessary.',
  'A real man should have as many sexual partners as he can.',
  'A man who talks a lot about his worries, fears, and problems  shouldn\'t really get respect.',
  'A gay guy is not a “real man”.',
  'Boys who don\'t play sport are “soft”.',
  'Women and men are just naturally different in the way they think and behave.',
  'Boys who get good marks at school are “nerds”.',
  'Men are better than women at things like science, engineering, medicine, and technology..'
];

const labels = {
  1: 'Strongly disagree',
  2: 'Disagree',
  3: 'Slightly disagree',
  4: 'Neither agree nor disagree',
  5: 'Slightly agree',
  6: 'Agree',
  7: 'Strongly agree'
};

const Step2_GenderNorms = ({ data, updateFormData, onNext, onBack }) => {
  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="md" color="gray.600" mb={2}>
        Please answer the following questions:
      </Text>

      {questions.map((question, index) => {
        const key = `gender_q${index + 1}`;
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

export default Step2_GenderNorms;