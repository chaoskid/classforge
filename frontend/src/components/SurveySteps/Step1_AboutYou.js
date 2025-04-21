// src/components/SurveySteps/Step1_AboutYou.js
import React from 'react';
import {
  Box, Button, FormControl, FormLabel,
  RadioGroup, Radio, VStack, Slider,
  SliderTrack, SliderFilledTrack, SliderThumb, Text
} from '@chakra-ui/react';

const Step1_AboutYou = ({ data, updateFormData, onNext }) => {
  
  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="md" color="gray.600" mb={2}>
        Let's get started with some personal background:
      </Text>

      <FormControl isRequired>
        <FormLabel fontWeight="semibold">Which language(s) do you speak at home?</FormLabel>
        <RadioGroup
          onChange={(val) => updateFormData('home_lang_ans', val)}
          value={data.home_lang_ans || ''}
        >
          <VStack align="start">
            <Radio value="english_only">English only</Radio>
            <Radio value="some_english">Some English and another language</Radio>
            <Radio value="non_english">Only a language other than English</Radio>
          </VStack>
        </RadioGroup>
      </FormControl>

      <Box textAlign="right">
        <Button colorScheme="teal" onClick={onNext} isDisabled={!data.home_lang_ans}>
          Next
        </Button>
      </Box>
    </VStack>
  );
};

export default Step1_AboutYou;
