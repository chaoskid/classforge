import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  List,
  ListItem,
  Avatar,
  HStack,
  Text,
  Collapse,
  VStack,
  Spinner,
  useToast
} from '@chakra-ui/react';
import axios from '../pages/axiosConfig';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Reallocate() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [results, setResults] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPool() {
      setLoading(true);
      try {
        const { data } = await axios.get('/api/reallocate');
        setStudents(data);
      } catch (err) {
        toast({ title: 'Error fetching reallocation pool.', status: 'error', duration: 5000 });
      } finally {
        setLoading(false);
      }
    }
    fetchPool();
  }, [toast]);

  const handleReallocate = async () => {
    setAllocating(true);
    try {
      const { data } = await axios.post('/api/reallocate');
      toast({ title: data.message, status: 'success', duration: 5000 });
      setResults(data.updated_students || []);
      setStudents([]);
    } catch (err) {
      toast({ title: 'Reallocation failed.', status: 'error', duration: 5000 });
    } finally {
      setAllocating(false);
    }
  };

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10} pt={10}>
        <Container maxW="7xl" minH="90vh" bg="white" borderRadius="lg" boxShadow="lg" p={10}>
          <Button colorScheme="blue" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Box minH="3vh" />
          <VStack spacing={4} align="start">
            <Heading size="lg">Pending Reallocation Requests</Heading>
            <Text>Total Requests: {students.length}</Text>

            {loading ? (
              <Spinner size="lg" />
            ) : students.length === 0 ? (
              <Text>No students have requested reallocation.</Text>
            ) : (
              <Box w="full">
                <Collapse in={showAll} animateOpacity>
                  <List spacing={3}>
                    {students.map(student => (
                      <ListItem key={student.student_id}>
                        <HStack spacing={3}>
                          <Avatar name={`${student.first_name} ${student.last_name}`} />
                          <Box>
                            <Text fontWeight="semibold">
                              {student.first_name} {student.last_name}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              Class: {student.current_class}
                            </Text>
                          </Box>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
                {!showAll && students.length > 5 && (
                  <List spacing={3}>
                    {students.slice(0, 5).map(student => (
                      <ListItem key={student.student_id}>
                        <HStack spacing={3}>
                          <Avatar name={`${student.first_name} ${student.last_name}`} />
                          <Box>
                            <Text fontWeight="semibold">
                              {student.first_name} {student.last_name}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              Current class: {student.current_class}
                            </Text>
                          </Box>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                )}
                {students.length > 5 && (
                  <Button size="sm" variant="link" onClick={() => setShowAll(!showAll)}>
                    {showAll ? 'Show Less' : `Show ${students.length - 5} More`}
                  </Button>
                )}
              </Box>
            )}

            <Button
              colorScheme="green"
              isLoading={allocating}
              isDisabled={students.length === 0}
              onClick={handleReallocate}
            >
              Allocate Reallocation Pool
            </Button>

            {results.length > 0 && (
              <Box w="full" pt={6}>
                <Heading size="md">Reallocation Results</Heading>
                <List spacing={3} mt={2}>
                  {results.map(item => (
                    <ListItem key={item.student_id}>
                      <HStack spacing={3}>
                        <Avatar name={`${item.first_name} ${item.last_name}`} />
                        <Box>
                          <Text fontWeight="semibold">
                            {item.first_name} {item.last_name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Moved fron Class {item.old_class} → Class {item.new_class}
                          </Text>
                        </Box>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

          </VStack>
        </Container>
      </Box>
      <Footer />
    </>
  );
}
