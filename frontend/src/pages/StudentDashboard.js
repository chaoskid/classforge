// src/pages/StudentDashboard.js
import React from 'react';
import { Box, Container, Heading, Text, Button } from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.post('/api/logout', {}, { withCredentials: true });
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="2xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={4}>Student Dashboard</Heading>
          <Text mb={6}>Welcome to ClassForge! Here you can view or complete your surveys, check classroom allocation, and more.</Text>
          <Button colorScheme="teal" onClick={() => navigate('/survey')} mr={4}>
            Go to Survey
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default StudentDashboard;
