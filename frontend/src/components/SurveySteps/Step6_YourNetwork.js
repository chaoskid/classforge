// src/components/SurveySteps/Step6_YourNetwork.js
import React, { useEffect, useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, VStack, Text
} from '@chakra-ui/react';
import Select from 'react-select';
import axios from 'axios';

const currentUserId = 32437; // TEMP: hardcoded for testing

const networkQuestions = [
  { key: 'friends', label: 'Who are your closest friends?', link_type: 'friends' },
  { key: 'advice', label: 'Which other students do you go to for advice about schoolwork?', link_type: 'advice' },
  { key: 'disrespect', label: 'Which students are disrespectful towards you?', link_type: 'disrespect' },
  { key: 'popular', label: 'Who are the most popular and influential students?', link_type: 'influence' },
  { key: 'more_time', label: 'Who would you like to spend MORE time with?', link_type: 'more_time' },
  { key: 'feedback', label: 'Which students provide you with meaningful feedback about your learning?', link_type: 'feedback' },
  { key: 'activities', label: 'What school activities are you a part of?' }
];

const Step6_YourNetwork = ({ data, updateFormData, onNext, onBack }) => {
  const [studentOptions, setStudentOptions] = useState([]);
  const [clubOptions, setClubOptions] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/students').then(res => {
      console.log("Students fetched:", res.data);
      const opts = res.data.map(stu => ({
        value: stu.student_id,
        label: `${stu.first_name} ${stu.last_name}`
      }));
      setStudentOptions(opts);
    });

    axios.get('http://localhost:5000/api/clubs').then(res => {
      const opts = res.data.map(club => ({
        value: club.club_id,
        label: club.club_name
      }));
      setClubOptions(opts);
    });
  }, []);

  const handleChange = (key, selectedOptions) => {
    updateFormData(key, selectedOptions); // store array of { value, label }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="md" color="gray.600" mb={2}>
        Please tell us about your social connections:
      </Text>

      {networkQuestions.map((q) => (
        <FormControl key={q.key}>
          <FormLabel fontWeight="semibold">{q.label}</FormLabel>
          {(q.key === 'activities' ? clubOptions.length > 0 : studentOptions.length > 0) && (
            <Select
              isMulti
              isSearchable
              placeholder="Start typing to search..."
              options={q.key === 'activities' ? clubOptions : studentOptions}
              value={data[q.key] || []}
              onChange={(selected) => handleChange(q.key, selected)}
            />
          )}
        </FormControl>
      ))}

      <Box display="flex" justifyContent="space-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button colorScheme="teal" onClick={onNext}>Next</Button>
      </Box>
    </VStack>
  );
};

export default Step6_YourNetwork;
