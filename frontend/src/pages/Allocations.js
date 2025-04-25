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
  Spinner,
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';
import { useNavigate } from 'react-router-dom';

const Allocations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleAllocate = async () => {
    setLoading(true);
    try {
      // → Axios GET to /api/allocate
      const { data } = await axios.get('/api/allocate');
      // data is { allocation_summary: [...], message: "..." }
      navigate('/allocation-results', { state: data });
    } catch (err) {
      console.error(err);
      alert('Error allocating students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                onClick={handleAllocate}
                bg="white"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                boxShadow="sm"
                _hover={{ boxShadow: 'md' }}
                position="relative"
                disabled={loading}
              >
                <Center h="100%">
                  {loading ? <Spinner size="lg" /> : <Heading size="md">Allocate Students</Heading>}
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
