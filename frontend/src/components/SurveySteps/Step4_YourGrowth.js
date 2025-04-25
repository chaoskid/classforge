// src/components/SurveySteps/Step4_YourGrowth.js
import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel,
  Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, Text, VStack, Heading, useToast,
  ListItem, UnorderedList
} from '@chakra-ui/react';

const questions = [
  'I have a certain amount of intelligence, and I can\'t really do much to change it.',
  'I can learn new things, but I can\'t really change my basic intelligence.',
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

const Step4_YourGrowth = ({ data, updateFormData, onNext, onBack }) => {
  const toast = useToast();
  const [errorFields, setErrorFields] = useState([]);

  const handleNext = () => {
    const unanswered = questions
      .map((q, i) => ({
        key: `intelligence_q${i + 1}`,
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
        Tell us what you think about intelligence and learning:
      </Heading>

      <VStack spacing={6} align="stretch">
        {questions.map((question, i) => {
          const key = `intelligence_q${i + 1}`;
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

export default Step4_YourGrowth;
