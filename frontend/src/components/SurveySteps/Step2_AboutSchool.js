// src/components/SurveySteps/Step2_AboutSchool.js
import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, VStack, Text, useToast, UnorderedList, ListItem, Heading
} from '@chakra-ui/react';

const questions = [
  'I feel comfortable at school.',
  'At school, I feel isolated because of my opinions.',
  'When someone criticises the school, it feels like a personal insult.',
  'At school, my opinion doesn\'t count for much.',
  'At this school, bullying is not tolerated at all.',
  'I believe that what I learn at school will help me in my future.',
  'I feel worried that COVID-19 has had a big impact on my education.'
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
  const toast = useToast();
  const [errorFields, setErrorFields] = useState([]);

  const handleNext = () => {
    const unanswered = questions
      .map((label, index) => ({
        key: `school_q${index + 1}`,
        label: `${index + 1}. ${label}`
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
                {unanswered.map((q) => (
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
        Please answer the following questions about your experience at school:
      </Heading>
      <VStack spacing={6} align="stretch">
        {questions.map((question, index) => {
          const key = `school_q${index + 1}`;
          const value = data[key] ?? 4;

          return (
            <FormControl key={key} isRequired isInvalid={errorFields.includes(key)}>
              <FormLabel fontWeight="semibold">
                {index + 1}. {question}
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

export default Step2_AboutSchool;
