import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Select,
  Button,
  Text,
  Spinner,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';

const ManualOverride = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch students and classes on mount
  useEffect(() => {
    setLoading(true);
    axios
      .get('/api/students-and-classes')
      .then(res => {
        setStudents(res.data.students);
        setClasses(res.data.classes);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load students or classes.');
      })
      .finally(() => {
        setLoading(false);
      }
      );
  }, []);

  const handleOverride = () => {
    if (!studentId || !classId) {
      setError('Please select both a student and a class.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    axios
      .post('/api/simulate-allocation', { student_id: +studentId, class_id: +classId })
      .then(res => {
        setResult(res.data);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.error || 'Override simulation failed.');
      })
      .finally(() => setLoading(false));
  };
  if (loading) {
    return (
      <>
        <Navbar />
        <Box bg="gray.100" minH="100vh" py={10} textAlign="center">
          <Heading mb={4}>Loading...</Heading>
          <Text mb={4}>Please wait while we fetch the data. Our database is currently hosted in a slow and free tier system. Hang on tight!</Text>
          <Spinner size="xl" />
        </Box>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box bg="gray.50" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Button mb={4} onClick={() => navigate(-1)} colorScheme="blue">
            &larr; Back
          </Button>

          <Heading size="lg" mb={6}>Manual Override</Heading>

          <Stack spacing={4} mb={6}>
            <Box>
              <Text mb={1}>Select Student:</Text>
              <Select
                placeholder="Choose a student"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
              >
                {students.map(s => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Box>

            <Box>
              <Text mb={1}>Select New Class:</Text>
              <Select
                placeholder="Choose a class"
                value={classId}
                onChange={e => setClassId(e.target.value)}
              >
                {classes.map(c => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_label}
                  </option>
                ))}
              </Select>
            </Box>

            <Button
              colorScheme="green"
              onClick={handleOverride}
              isDisabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Go'}
            </Button>
          </Stack>

          {error && (
            <Text color="red.500" mb={4}>
              {error}
            </Text>
          )}

          {result && (
            <Box>
              <Heading size="md" mb={2}>Feature Averages & Deviations</Heading>
              <Table variant="striped" size="sm" mb={6}>
                <Thead>
                  <Tr>
                    <Th>Feature</Th>
                    <Th isNumeric>Original Avg</Th>
                    <Th isNumeric>New Avg</Th>
                    <Th isNumeric>Deviation</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Object.keys(result.original_averages).map(feature => {
                    const orig = result.original_averages[feature];
                    const neu  = result.new_averages[feature];
                    const dev  = neu - orig;
                    return (
                      <Tr key={feature}>
                        <Td>{feature.replace(/_/g, ' ')}</Td>
                        <Td isNumeric>{orig.toFixed(3)}</Td>
                        <Td isNumeric>{neu.toFixed(3)}</Td>
                        <Td isNumeric color={dev >= 0 ? 'green.600' : 'red.600'}>
                          {dev.toFixed(3)}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>

              <Divider mb={4} />

              <Heading size="md" mb={2}>Relationship Summary</Heading>
              <Table variant="striped" size="sm">
                <Thead>
                  <Tr>
                    <Th>Type</Th>
                    <Th isNumeric>Total</Th>
                    <Th isNumeric>Current Class</Th>
                    <Th isNumeric>Target Class</Th>
                    <Th isNumeric>Difference</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Object.entries(result.relationship_summary).map(
                    ([type, stats]) => (
                      <Tr key={type}>
                        <Td>{type.replace(/_/g, ' ')}</Td>
                        <Td isNumeric>{stats.total}</Td>
                        <Td isNumeric>{stats.current_class}</Td>
                        <Td isNumeric>{stats.target_class}</Td>
                        <Td isNumeric color={stats.difference >= 0 ? 'green.600' : 'red.600'}>
                          {stats.difference}
                        </Td>
                      </Tr>
                    )
                  )}
                </Tbody>
              </Table>
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default ManualOverride;
