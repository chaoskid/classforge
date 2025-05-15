// src/pages/TeacherFeedbackPage.js
import React, { useEffect, useState } from 'react';
import {
  Box, Button, Container, Heading, Textarea, VStack, Text, Select, useToast
} from '@chakra-ui/react';
import axios from './axiosConfig';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TeacherFeedbackPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [studentFeedback, setStudentFeedback] = useState('');
  const toast = useToast();

  // Load students who submitted feedback
  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await axios.get('/api/all-feedback-submitted', { withCredentials: true });
        setStudents(res.data);
      } catch (err) {
        console.error(err);
        toast({ title: 'Failed to load students', status: 'error', duration: 3000 });
      }
    }
    fetchStudents();
  }, [toast]);

  // Fetch the selected student's feedback
  const handleStudentChange = async (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);
    setStudentFeedback('');
    try {
      const res = await axios.get(`/api/student-feedback/${studentId}`, { withCredentials: true });
      setStudentFeedback(res.data.student_feedback || '');
    } catch (err) {
      console.error('Failed to fetch student feedback:', err);
      toast({ title: 'Could not fetch student feedback.', status: 'error' });
    }
  };

  // Submit teacher's feedback
  const handleSubmit = async () => {
    if (!selectedStudent || !feedbackText.trim()) {
      toast({ title: 'Please select a student and enter feedback.', status: 'warning' });
      return;
    }
    try {
      await axios.post('/api/teacher-feedback', {
        student_id: selectedStudent,
        teacher_feedback: feedbackText
      }, { withCredentials: true });

      toast({ title: 'Feedback submitted.', status: 'success' });
      setFeedbackText('');
    } catch (err) {
      console.error('Submission error:', err);
      toast({ title: 'Error submitting feedback', status: 'error' });
    }
  };

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="3xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={6}>Submit Feedback to Students</Heading>
          <VStack spacing={6}>
            <Select
              placeholder="Select student"
              value={selectedStudent}
              onChange={handleStudentChange}
            >
              {students.map(s => (
                <option key={s.student_id} value={s.student_id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </Select>

            {selectedStudent && (
              <Box mt={2} p={4} borderWidth="1px" borderRadius="md" bg="gray.50" width="100%">
                <Text fontWeight="semibold">Student’s Feedback:</Text>
                <Text mt={2} color="gray.700">
                  {studentFeedback || "This student hasn't submitted any feedback yet."}
                </Text>
              </Box>
            )}

            <Textarea
              placeholder="Write feedback for the student..."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
            />
            <Button colorScheme="teal" onClick={handleSubmit}>
              Submit Feedback
            </Button>
          </VStack>
        </Container>
      </Box>
      <Footer />
    </>
  );
}
