// src/pages/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Box,
  Container,
  Heading,
  Text,
  Button,
  Table,
  Tbody,
  Tr,
  Td,
  SimpleGrid } from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';
import { useNavigate } from 'react-router-dom';
import StudentNetworkGraph from '../components/StudentNetworkGraph';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState({});
  const [studentDetails, setStudentDetails] = useState({});
  
  useEffect(() => {
    axios.get('/api/student-survey-responses', { withCredentials: true })
      .then(res => {
        if (res.status === 200) {
          setResponses(res.data);
        }
      }).catch(err => console.error(err));
      axios.post('/api/student-details', {}, { withCredentials: true })
      .then(res => {
        if (res.status === 200) {
          setStudentDetails(res.data);
        }
      })
      .catch(err => console.error(err));
      axios.get('/api/student-info', { withCredentials: true })
    .then(res => {
      if (res.status === 200) {
        setStudentDetails(res.data);
      }
    }).catch(err => console.error(err));
  }, []);
  const handleLogout = async () => {
    await axios.post('/api/logout', {}, { withCredentials: true });
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={4}>Student Dashboard</Heading>
          <Text mb={6}>Hi {studentDetails?.student?.name?.split(" ")[0]}, welcome to ClassForge!</Text>
          <Button colorScheme="teal" onClick={() => navigate('/survey')} mr={4}>
            Go to Survey
          </Button>
          <Button variant="outline" onClick={() => navigate('/survey')}>
          Retake Survey
          </Button>
          <Button variant="Outline" onClick={() => alert("Feedback system coming soon!")} mr={4}>
          Give Feedback
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
          {Object.keys(responses).length > 0 && (
  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={10}>
    {/* 📋 Survey Responses Box */}
    <Box p={4} border="1px solid #ccc" borderRadius="lg" bg="gray.50">
      <Heading size="md" mb={4}>Your Survey Responses</Heading>
      <Table size="sm" variant="simple">
        <Tbody>
          {Object.entries(responses).map(([question, answer], idx) => (
            <Tr key={idx}>
              <Td fontWeight="600">{question}</Td>
              <Td>{answer}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>

    <Box p={4} border="1px solid #ccc" borderRadius="lg" bg="gray.50">
      <Heading size="md" mb={4}>Student Info</Heading>
      <Text><b>Name:</b> {studentDetails?.student?.name}</Text>
      <Text><b>Email:</b> {studentDetails?.student?.email}</Text>
      <Text><b>Subjects:</b> {studentDetails?.units?.join(', ') || 'None'}</Text>
      <Text><b>Clubs:</b> {studentDetails?.clubs?.join(', ') || 'None'}</Text>
      {studentDetails?.relationships?.length > 0 && (
        <Box mt={6}>
          <Heading size="sm" mb={2}>Relationship Network</Heading>
          <StudentNetworkGraph
            name={studentDetails.student?.name || "You"}
            relationships={studentDetails.relationships}
          />
        </Box>
       )}
    </Box>
  </SimpleGrid>
)}

        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default StudentDashboard;
