// src/pages/StudentFeedback.js
import React, { useEffect, useState } from 'react';
import {
  Box, Button, Container, Heading, FormControl, FormLabel, Textarea,
  VStack, Text, useToast
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Select from 'react-select';
import axios from '../pages/axiosConfig';
import { useNavigate } from 'react-router-dom';

const networkQuestions = [
  { key: 'friends',    label: 'Who are your closest friends?' },
  { key: 'advice',     label: 'Which other students do you go to for advice about schoolwork?' },
  { key: 'disrespect', label: 'Which students are disrespectful towards you?' },
  { key: 'influence',    label: 'Who are the most popular and influential students?' },
  { key: 'more_time',  label: 'Who would you like to spend MORE time with?' },
  { key: 'feedback',   label: 'Which students provide you with meaningful feedback about your learning?' }
];

export default function StudentFeedback() {
  const toast = useToast();
  const navigate = useNavigate();

  const [userId, setUserId]                   = useState(null);
  const [studentOptions, setStudentOptions]   = useState([]);
  const [formData, setFormData]               = useState({});
  const [studentFeedback, setStudentFeedback] = useState('');
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [isHappy, setIsHappy] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [
          studentsRes,
          userRes,
          relRes,
          teacherFbRes
        ] = await Promise.all([
          axios.get('/api/students',          { withCredentials: true }),
          axios.get('/api/current_user',      { withCredentials: true }),
          axios.get('/api/student-relationships',{ withCredentials: true }),
          axios.get('/api/teacher-feedbacks', { withCredentials: true })
        ]);

        
        const user = userRes.data;
        setUserId(user.user_id);

        // 2) BUILD DROPDOWN OPTIONS
        const students = studentsRes.data;
        setStudentOptions(
          students.map(s => ({
            value: s.student_id,
            label: `${s.first_name} ${s.last_name}`
          }))
        );

        // 3) PRELOAD SAVED LINKS
        const savedRels = relRes.data.relationships || {};
        const initial = {};
        networkQuestions.forEach(q => {
          const arr = Array.isArray(savedRels[q.key]) ? savedRels[q.key] : [];
          initial[q.key] = arr.map(item => {
            // find the real name from students[]
            const s = students.find(st => st.student_id === item.value);
            return {
              value: item.value,
              label: s
                ? `${s.first_name} ${s.last_name}`
                : item.label
            };
          });
        });
        setFormData(initial);

        // 4) PREFILL STUDENT FEEDBACK
        setStudentFeedback(relRes.data.student_feedback || '');

        // 5) PREFILL TEACHER FEEDBACK
        const tfb = teacherFbRes.data.find(f => f.student_id === user.user_id);
        setTeacherFeedback(tfb?.teacher_feedback || '');

      } catch (err) {
        console.error('Load error:', err);
        toast({ title: 'Error loading data.', status: 'error', duration: 3000 });
      }
    }
    load();
  }, [toast]);

  // update local formData when dropdowns change
  const handleSelectChange = (key, selected) => {
    setFormData(fd => ({ ...fd, [key]: selected }));
  };

  // SAVE: feedback first, then relationships
const handleSubmit = async () => {
  try {
    await axios.post('/api/feedback', {
  student_feedback: studentFeedback,
  is_happy: isHappy  // send boolean flag
}, { withCredentials: true });

    // 1) Save student feedback
    await axios.post('/api/feedback', {
      student_feedback: studentFeedback
    }, {
      withCredentials: true
    });

    // 2) Save relationships
    const relPayload = [];
    Object.entries(formData).forEach(([key, arr]) =>
      arr.forEach(opt =>
        relPayload.push({
          source_id: userId,
          target_id: opt.value,
          link_type: key
        })
      )
    );
    await axios.post('/api/student-relationships', {
      relationships: relPayload
    }, {
      withCredentials: true
    });

    toast({ title: 'Submitted!', status: 'success', duration: 2000 });
    navigate('/student-dashboard');
  } catch (err) {
    console.error('Submission error:', err);
    toast({
      title: 'Submission failed',
      description: err.response?.data?.error || err.message,
      status: 'error',
      duration: 3000
    });
  }
};


  return (
    <>
      <Navbar/>
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="6xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Button colorScheme="blue" onClick={() => navigate(-1)}>
                          Back
                        </Button>
          <Heading size="lg" mb={6}>Update Social Network & Submit Feedback</Heading>
          <VStack spacing={6} align="stretch">
            {networkQuestions.map(q => (
              <FormControl key={q.key}>
                <FormLabel>{q.label}</FormLabel>
                <Select
                  isMulti
                  isSearchable
                  options={studentOptions}
                  value={formData[q.key] || []}
                  onChange={sel => handleSelectChange(q.key, sel)}
                />
              </FormControl>
            ))}
            <FormControl isRequired>
               <FormLabel>Do you want to request for a reallocation?</FormLabel>
               <Box>
                   <Button
                      colorScheme={isHappy === true ? 'teal' : 'gray'}
                      onClick={() => setIsHappy(true)}
                     mr={4}
                   >
                  Yes
                </Button>
                 <Button
                     colorScheme={isHappy === false ? 'red' : 'gray'}
                     onClick={() => setIsHappy(false)}
                 >
                 No
                </Button>
                </Box>
               </FormControl>

            <FormControl>
              <FormLabel>Your Feedback (to teacher)</FormLabel>
              <Textarea
                placeholder="Write your feedback here…"
                value={studentFeedback}
                onChange={e => setStudentFeedback(e.target.value)}
              />
            </FormControl>

            <Button colorScheme="teal" onClick={handleSubmit}>Submit</Button>

            <FormControl mt={8}>
              <FormLabel>Feedback from your teacher</FormLabel>
              <Box p={4} bg="gray.50" borderRadius="md" border="1px solid #ccc">
                {teacherFeedback
                  ? <Text>{teacherFeedback}</Text>
                  : <Text color="gray.500">Teacher has yet to give feedback.</Text>
                }
              </Box>
            </FormControl>
          </VStack>
        </Container>
      </Box>
      <Footer/>
    </>
  );
}
