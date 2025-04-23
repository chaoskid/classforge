// src/pages/TeacherDashboard.js
import React from 'react';
import { Box, Container, Heading, Text, Button } from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.post('/api/logout', {}, { withCredentials: true });
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={4}>Teacher Dashboard</Heading>
          <Text mb={6}>Welcome to ClassForge! View student analytics, track feedback, and manage classroom allocations here.</Text>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default TeacherDashboard;
