// src/components/SurveySteps/Step7_ReviewSubmit.js
import React from 'react';
import {
  Box, Button, VStack, Text, Divider
} from '@chakra-ui/react';

const questionMap = {
  student_id: "Student ID:",
  home_lang_ans: 'Which language(s) do you speak at home?',
  school_q1: 'I feel comfortable at school.',
  school_q2: 'At school, I feel isolated because of my opinions.',
  school_q3: 'When someone criticises the school, it feels like a personal insult.',
  school_q4: 'At school, my opinion doesn\'t count for much.',
  school_q5: 'At this school, bullying is not tolerated at all.',
  school_q6: 'I believe that what I learn at school will help me in my future.',
  school_q7: 'I feel worried that COVID-19 has had a big impact on my education.',
  how_happy_ans: 'How happy are you with your life as a whole?',
  wellbeing_q1: 'During the past 30 days, about how often did you feel nervous?',
  wellbeing_q2: 'During the past 30 days, about how often did you feel hopeless?',
  wellbeing_q3: 'During the past 30 days, about how often did you feel restless or fidgety?',
  wellbeing_q4: 'During the past 30 days, about how often did you feel so depressed that nothing could cheer you up?',
  wellbeing_q5: 'During the past 30 days, about how often did you feel that everything was an effort?',
  wellbeing_q6: 'During the past 30 days, about how often did you feel worthless?',
  intelligence_q1: 'I have a certain amount of intelligence, and I can\'t really do much to change it',
  intelligence_q2: 'I can learn new things, but I can\'t really change my basic intelligence.',
  gender_q1: "A man shouldn't have to do household chores.",
  gender_q2: "Men should use violence to get respect if necessary.",
  gender_q3: "A real man should have as many sexual partners as he can.",
  gender_q4: "A man who talks a lot about his worries shouldn't really get respect.",
  gender_q5: 'A gay guy is not a “real man”.',
  gender_q6: 'Boys who don\'t play sport are “soft”.',
  gender_q7: 'Women and men are just naturally different in the way they think and behave',
  gender_q8: 'Boys who get good marks at school are “nerds”.',
  gender_q9: 'Men are better than women at things like science, engineering, and tech.',
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
};

const wellbeingLabels = {
  1: 'None of the time',
  2: 'A little of the time',
  3: 'Some of the time',
  4: 'Most of the time',
  5: 'All the time'
};

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


const Step7_ReviewSubmit = ({ data, onSubmit, onBack }) => {
  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>Review your responses:</Text>
        <Box maxH="300px" overflowY="auto" p={4} border="1px solid #E2E8F0" borderRadius="md" bg="gray.50">
          {Object.entries(data).map(([key, value]) => (
            <Box key={key} mb={3}>
              <Text fontWeight="600">{questionMap[key] || key}</Text>
              <Text color="gray.700">
                {
                  Array.isArray(value)
                    ? value.map(item => item.label).join(', ')
                    : (
                        key === 'how_happy_ans' ? happinessLabels[value] :
                        key.startsWith('wellbeing_q') ? wellbeingLabels[value] :
                        typeof value === 'number' && scaleLabels[value] ? scaleLabels[value] :
                        String(value)
                      )
                }
              </Text>
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

export default Step7_ReviewSubmit;
