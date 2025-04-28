import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Button, HStack, Text, VStack
} from '@chakra-ui/react';
import axios from '../pages/axiosConfig';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Ensure Navbar is correctly imported
import Footer from '../components/Footer'; // Ensure Footer is correctly imported

const StudentAllocationSetup = () => {
  const [loading, setLoading] = useState(false);
  const [unallocatedStudents, setUnallocatedStudents] = useState(0);
  const [numClasses, setNumClasses] = useState(null);
  const [studentsPerClass, setStudentsPerClass] = useState(null);
  const [modelPath, setModelPath] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnallocatedStudents = async () => {
      try {
        const response = await axios.get('/api/stage_allocation');
        setUnallocatedStudents(response.data.number_of_unallocated_students);
      } catch (err) {
        console.error('Failed to fetch unallocated students:', err);
      }
    };

    fetchUnallocatedStudents();

    // Scroll to the top of the page
    window.scrollTo(0, 0); // This will ensure the page starts from the top

    // Focus on the header (navbar) when the page first loads
    const navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.focus();
    }
  }, []);

  const handleClassSelection = (numClasses) => {
    setNumClasses(numClasses);
    setStudentsPerClass(Math.floor(unallocatedStudents / numClasses));
    setModelPath(`dq${numClasses}.pth`);
  };

  const handleAllocate = async () => {
    if (!numClasses) {
      alert('Please select a number of classes.');
      return;
    }

    setLoading(true);

    try {
      // Post the selected model path and number of classes to the backend
      const { data } = await axios.post('/api/allocate', {
        model_path: modelPath,
        num_classes: numClasses
      });
      navigate('/allocation-results', { state: data });
    } catch (err) {
      console.error('Error allocating students:', err);
      alert('Allocation failed, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar id="navbar" tabIndex="-1" />  {/* Add id and set tabIndex for focusing */}
      <Box
        bg="gray.100"
        minH="100vh"
        py={10} // Standard distance from the header (not centered too much)
        pt={20} // Give a bit more space from the header
      >
        <Container maxW="6xl" py={8}>
          <VStack spacing={6} align="center">
            <Heading size="lg">Student Allocation Setup</Heading>

            <Text fontSize="xl">Number of Unallocated Students: {unallocatedStudents}</Text>

            <Text fontSize="xl">Select Number of Classes</Text>
            <HStack spacing={6}>
              {[5, 7, 9].map((num) => (
                <Button
                  key={num}
                  colorScheme={numClasses === num ? 'blue' : 'transparent'}
                  border="2px solid #2B6CB0" // Dark blue border
                  onClick={() => handleClassSelection(num)}
                  _hover={{ borderColor: '#2B6CB0', color: '#2B6CB0' }}  // Change text color on hover
                  isActive={numClasses === num}
                  _focus={{ boxShadow: 'none' }}
                  _disabled={{ color: 'gray.400', borderColor: 'gray.400' }} // Disabled state color
                  color={numClasses === num ? 'white' : '#2B6CB0'} // Set text color for selected button
                >
                  {num} Classes
                </Button>
              ))}
            </HStack>

            {studentsPerClass !== null && (
              <Text fontSize="xl">
                Each class will have around {studentsPerClass} students.
              </Text>
            )}

            <Button
              colorScheme="green"
              onClick={handleAllocate}
              isLoading={loading}
              isDisabled={!numClasses}
            >
              Allocate Students
            </Button>

            {/* Back Button */}
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={() => navigate(-1)} // Navigate back to the previous page
              mt={4}
              border="2px solid #2B6CB0" // Dark blue border
              _hover={{ backgroundColor: '#2B6CB0', color: 'white' }}
            >
              Back
            </Button>
          </VStack>
        </Container>
      </Box>
      <Footer />  {/* Add Footer */}
    </>
  );
};

export default StudentAllocationSetup;
