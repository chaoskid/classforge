// src/components/SurveySteps/Step5_ReviewSubmit.js
import React from 'react';
import {
  Box, Button, VStack, Text, Divider
} from '@chakra-ui/react';

const questionMap = {
  homeLanguage: 'Which language(s) do you speak at home?',
  happiness: 'How happy are you with your life as a whole?',
  school_q1: 'I feel comfortable at school.',
  school_q2: 'At school, I feel isolated because of my opinions.',
  school_q3: 'When someone criticises the school, it feels like a personal insult.',
  school_q4: 'At school, my opinion doesn’t count for much.',
  school_q5: 'At this school, bullying is not tolerated at all.',
  school_q6: 'I believe that what I learn at school will help me in my future.',
  opinion_q1: "A man shouldn't have to do household chores.",
  opinion_q2: "Men should use violence to get respect if necessary.",
  opinion_q3: "A real man should have as many sexual partners as he can.",
  opinion_q4: "A man who talks a lot about his worries shouldn't really get respect.",
  opinion_q5: 'A gay guy is not a “real man”.',
  opinion_q6: 'Boys who don’t play sport are “soft”.',
  opinion_q7: 'Boys who get good marks at school are “nerds”.',
  opinion_q8: 'Men are better than women at things like science, engineering, and tech.',
  friends: 'Who are your closest friends?',
  advice: 'Which other students do you go to for advice about schoolwork?',
  disrespect: 'Which students are disrespectful towards you?',
  popular: 'Who are the most popular and influential students?',
  more_time: 'Who would you like to spend MORE time with?',
  feedback: 'Which students provide you with meaningful feedback about your learning?',
  activities: 'What school activities are you a part of?'
};

const scaleLabels = {
  1: 'Strongly disagree',
  2: 'Disagree',
  3: 'Somewhat disagree',
  4: 'Neutral',
  5: 'Somewhat agree',
  6: 'Agree',
  7: 'Strongly agree',
  0: 'Very unhappy',
  10: 'Totally happy'
};

const Step5_ReviewSubmit = ({ data, onSubmit, onBack }) => {
  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>Review your responses:</Text>
        <Box maxH="300px" overflowY="auto" p={4} border="1px solid #E2E8F0" borderRadius="md" bg="gray.50">
          {Object.entries(data).map(([key, value]) => (
            <Box key={key} mb={3}>
              <Text fontWeight="medium">Q: {questionMap[key] || key}</Text>
              <Text color="gray.700">A: {typeof value === 'number' && scaleLabels[value] ? scaleLabels[value] : String(value)}</Text>
              <Divider my={2} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button colorScheme="blue" onClick={onSubmit}>Submit</Button>
      </Box>
    </VStack>
  );
};

export default Step5_ReviewSubmit;
