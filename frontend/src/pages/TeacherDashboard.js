// src/pages/TeacherDashboard.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Divider,
  SimpleGrid,
  AspectRatio,
  Center,
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
          <Divider mb={6} />
          <Text mb={6}>
            Welcome to ClassForge! View student analytics, track feedback, and manage classroom allocations here.
          </Text>

          <SimpleGrid columns={[1, null, 3]} spacing={6} justifyItems="center">
            {/* Students */}
            <AspectRatio ratio={1} maxW="240px" w="100%">
              <Box
                as="button"
                onClick={() => handleInProgress('Students')}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                boxShadow="base"
                transition="all 0.2s"
                _hover={{
                  boxShadow: 'md',
                  borderColor: 'gray.300',
                }}
              >
                <Center h="100%">
                  <Heading size="md">Students</Heading>
                </Center>
              </Box>
            </AspectRatio>

            {/* Allocations */}
            <AspectRatio ratio={1} maxW="240px" w="100%">
              <Box
                as="button"
                onClick={() => navigate('/teacher/allocations')}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                boxShadow="base"
                transition="all 0.2s"
                _hover={{
                  boxShadow: 'md',
                  borderColor: 'gray.300',
                }}
              >
                <Center h="100%">
                  <Heading size="md">Allocations</Heading>
                </Center>
              </Box>
            </AspectRatio>

            {/* Classes */}
            <AspectRatio ratio={1} maxW="240px" w="100%">
              <Box
                as="button"
                onClick={() => handleInProgress('Classes')}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                boxShadow="base"
                transition="all 0.2s"
                _hover={{
                  boxShadow: 'md',
                  borderColor: 'gray.300',
                }}
              >
                <Center h="100%">
                  <Heading size="md">Classes</Heading>
                </Center>
              </Box>
            </AspectRatio>
          </SimpleGrid>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default TeacherDashboard;
