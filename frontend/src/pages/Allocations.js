// src/pages/Allocations.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Divider,
  AspectRatio,
  Center,
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const Allocations = () => {
  const navigate = useNavigate();
  const handleInProgress = (section) => alert(`${section} page is in progress`);

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={4}>Allocations</Heading>
          <Divider mb={6} />

          <SimpleGrid columns={[1, 3]} spacing={6} justifyItems="center">
            {/* Allocate Students */}
            <AspectRatio ratio={1} maxW="240px" w="100%">
              <Box
                as="button"
                onClick={() => handleInProgress('Allocate Students')}
                bg="white"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                boxShadow="sm"
                _hover={{ boxShadow: 'md' }}
              >
                <Center h="100%">
                  <Heading size="md">Allocate Students</Heading>
                </Center>
              </Box>
            </AspectRatio>

            {/* Manual Override */}
            <AspectRatio ratio={1} maxW="240px" w="100%">
              <Box
                as="button"
                onClick={() => handleInProgress('Manual Override')}
                bg="white"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                boxShadow="sm"
                _hover={{ boxShadow: 'md' }}
              >
                <Center h="100%">
                  <Heading size="md">Manual Override</Heading>
                </Center>
              </Box>
            </AspectRatio>

            {/* Reallocation */}
            <AspectRatio ratio={1} maxW="240px" w="100%">
              <Box
                as="button"
                onClick={() => handleInProgress('Reallocation')}
                bg="white"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                boxShadow="sm"
                _hover={{ boxShadow: 'md' }}
              >
                <Center h="100%">
                  <Heading size="md">Reallocation</Heading>
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

export default Allocations;
