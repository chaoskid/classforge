// src/components/SurveySteps/Step5_GenderNorms.js
import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel,
  Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, Text, VStack, Heading, useToast,
  ListItem, UnorderedList
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

const Step5_GenderNorms = ({ data, updateFormData, onNext, onBack }) => {
  const toast = useToast();
  const [errorFields, setErrorFields] = useState([]);

  const handleNext = () => {
    const unanswered = questions
      .map((q, i) => ({
        key: `gender_q${i + 1}`,
        label: `${i + 1}. ${q}`
      }))
      .filter(({ key }) => data[key] == null);

    if (unanswered.length > 0) {
      setErrorFields(unanswered.map(q => q.key));

      toast({
        title: 'Incomplete',
        description: (
          <Box>
            <Text mb={2}>
              {unanswered.length > 3
                ? 'Please answer all questions before continuing.'
                : 'Please answer the following questions:'}
            </Text>
            {unanswered.length <= 3 && (
              <UnorderedList pl={5}>
                {unanswered.map(q => (
                  <ListItem key={q.key}>{q.label}</ListItem>
                ))}
              </UnorderedList>
            )}
          </Box>
        ),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      return;
    }

    setErrorFields([]);
    onNext();
  };

  return (
    <Box>
      <Heading size="md" mb={6}>
        In your opinion:
      </Heading>

      <VStack spacing={6} align="stretch">
        {questions.map((question, i) => {
          const key = `gender_q${i + 1}`;
          const value = data[key] ?? 4;

          return (
            <FormControl key={key} isRequired isInvalid={errorFields.includes(key)}>
              <FormLabel fontWeight="semibold">
                {i + 1}. {question}
              </FormLabel>
              <Slider
                min={1}
                max={7}
                step={1}
                value={value}
                onChange={(val) => updateFormData(key, val)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Text mt={1}>Your answer: {labels[value]}</Text>
            </FormControl>
          );
        })}
      </VStack>

      <Box mt={10} display="flex" justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Button colorScheme="teal" onClick={handleNext}>
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default Step5_GenderNorms;
