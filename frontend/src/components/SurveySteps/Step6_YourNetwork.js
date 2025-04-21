// src/components/SurveySteps/Step4_YourNetwork.js
import React from 'react';
import {
  Box, Button, FormControl, FormLabel,
  Textarea, VStack, Text
} from '@chakra-ui/react';

const networkQuestions = [
  { key: 'friends', label: 'Who are your closest friends?' },
  { key: 'advice', label: 'Which other students do you go to for advice about schoolwork?' },
  { key: 'disrespect', label: 'Which students are disrespectful towards you?' },
  { key: 'popular', label: 'Who are the most popular and influential students?' },
  { key: 'more_time', label: 'Who would you like to spend MORE time with?' },
  { key: 'feedback', label: 'Which students provide you with meaningful feedback about your learning?' },
  { key: 'activities', label: 'What school activities are you a part of?' }
];

const Step4_YourNetwork = ({ data, updateFormData, onNext, onBack }) => {
  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="md" color="gray.600" mb={2}>
        Please tell us about your social connections:
      </Text>

      {networkQuestions.map((q) => (
        <FormControl key={q.key}>
          <FormLabel fontWeight="semibold">{q.label}</FormLabel>
          <Textarea
            value={data[q.key] || ''}
            onChange={(e) => updateFormData(q.key, e.target.value)}
            placeholder="Your answer..."
            rows={3}
          />
        </FormControl>
      ))}

      <Box display="flex" justifyContent="space-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button colorScheme="teal" onClick={onNext}>Next</Button>
      </Box>
    </VStack>
  );
};

export default Step4_YourNetwork;
