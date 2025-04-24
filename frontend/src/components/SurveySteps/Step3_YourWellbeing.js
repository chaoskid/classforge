import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel,
  Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, Text, VStack, Heading, useToast,
  UnorderedList, ListItem
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

const subQuestions = [
  'Nervous?',
  'Hopeless?',
  'Restless or fidgety?',
  'So depressed that nothing could cheer you up?',
  'That everything was an effort?',
  'Worthless?'
];

const labels = {
  1: 'None of the time',
  2: 'A little of the time',
  3: 'Some of the time',
  4: 'Most of the time',
  5: 'All the time'
};

const Step3_YourWellbeing = ({ data, updateFormData, onNext, onBack }) => {
  const toast = useToast();
  const [errorFields, setErrorFields] = useState([]);

  const handleNext = () => {
    const unanswered = [];

    if (data["how_happy_ans"] == null) {
      unanswered.push({ key: "how_happy_ans", label: "How happy are you with your life as a whole?" });
    }

    subQuestions.forEach((question, i) => {
      const key = `wellbeing_q${i + 1}`;
      if (data[key] == null) {
        unanswered.push({ key, label: `${i + 1}. ${question}` });
      }
    });

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
        Let's explore how you've been feeling recently:
      </Heading>

      <VStack spacing={6} align="stretch">
        {/* Happiness Question */}
        <FormControl isRequired isInvalid={errorFields.includes("how_happy_ans")}>
          <FormLabel fontWeight="semibold">How happy are you with your life as a whole?</FormLabel>
          <Slider
            min={0}
            max={10}
            step={1}
            value={data.how_happy_ans ?? 5}
            onChange={(val) => updateFormData("how_happy_ans", val)}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text mt={1}>Your answer: {happinessLabels[data.how_happy_ans ?? 5]}</Text>
        </FormControl>

        {/* Subquestion Header */}
        <Text fontWeight="semibold" mt={6}>
          During the past 30 days, about how often did you feel:
        </Text>

        {/* Likert Subquestions */}
        {subQuestions.map((question, i) => {
          const key = `wellbeing_q${i + 1}`;
          const value = data[key] ?? 3;

          return (
            <FormControl key={key} isRequired isInvalid={errorFields.includes(key)}>
              <FormLabel>{i + 1}. {question}</FormLabel>
              <Slider
                min={1}
                max={5}
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

export default Step3_YourWellbeing;
