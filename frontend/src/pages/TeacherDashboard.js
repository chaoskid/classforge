// src/pages/TeacherDashboard.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const handleInProgress = (section) => {
    alert(`${section} page is in progress`);
  };

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={2}>Teacher Dashboard</Heading>
          <Text mb={6}>
            Welcome to ClassForge! View student analytics, track feedback, and manage classroom allocations here.
          </Text>

          <SimpleGrid columns={[1, 3]} spacing={6}>
            {/* Students tile */}
            <Box
              as="button"
              onClick={() => handleInProgress('Students')}
              border="1px"
              borderColor="gray.300"
              borderRadius="md"
              height="150px"
              _hover={{ bg: 'gray.50' }}
            >
              <VStack h="100%" justify="center">
                <Heading size="md">Students</Heading>
              </VStack>
            </Box>

            {/* Allocations tile */}
            <Box
              as="button"
              onClick={() => navigate('/teacher/allocations')}
              border="1px"
              borderColor="gray.300"
              borderRadius="md"
              height="150px"
              _hover={{ bg: 'gray.50' }}
            >
              <VStack h="100%" justify="center">
                <Heading size="md">Allocations</Heading>
              </VStack>
            </Box>

            {/* Classes tile */}
            <Box
              as="button"
              onClick={() => handleInProgress('Classes')}
              border="1px"
              borderColor="gray.300"
              borderRadius="md"
              height="150px"
              _hover={{ bg: 'gray.50' }}
            >
              <VStack h="100%" justify="center">
                <Heading size="md">Classes</Heading>
              </VStack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default TeacherDashboard;
