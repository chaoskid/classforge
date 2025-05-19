import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  SimpleGrid,
  Flex,
  HStack
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';
import ForceGraph2D from 'react-force-graph-2d';

// Relationship colors
const REL_COLORS = {
  friends:    '#2ca02c',
  influence:  '#1f77b4',
  feedback:   '#9467bd',
  more_time:  '#ff7f0e',
  advice:     '#17becf',
  disrespect: '#d62728'
};

const ManualOverride = () => {
  const navigate = useNavigate();
  const existingRef = useRef(null);
  const predictedRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingGraphData, setExistingGraphData]   = useState({ nodes: [], links: [] });
  const [predictedGraphData, setPredictedGraphData] = useState({ nodes: [], links: [] });

  // Fetch students and classes on mount
  useEffect(() => {
    axios
      .get('/api/students-and-classes')
      .then(res => {
        setStudents(res.data.students);
        setClasses(res.data.classes);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load students or classes.');
      });
  }, []);

  // Build network graph data from result.existing_links
  useEffect(() => {
    if (!result?.existing_links) return;

    const rawLinks = result.existing_links.map(l => ({
      source: l.source,
      target: l.target,
      type:   l.link_type
    }));

    // group indices by source-target pair
    const groups = {};
    rawLinks.forEach((l, idx) => {
      const key = `${l.source}-${l.target}`;
      groups[key] = groups[key] || [];
      groups[key].push(idx);
    });

    // assign curvature per link in group
    const links = rawLinks.map((l, idx) => {
      const key = `${l.source}-${l.target}`;
      const idxs = groups[key];
      const pos = idxs.indexOf(idx);
      const count = idxs.length;
      const spread = 0.2; // spacing between curves
      const curvature = count > 1 ? (pos - (count - 1) / 2) * spread : 0;
      return { ...l, curvature };
    });

    // build unique node list
    const nodeIds = Array.from(
      new Set( links.flatMap(l => [l.source, l.target]) )
    );
    const nodes = nodeIds.map(id => {
      const s = students.find(st => st.student_id === id);
      return { id, name: s ? s.name : id.toString() };
    });

    setExistingGraphData({ nodes, links });
  }, [result, students]);

  // Auto-fit existing graph on update
  useEffect(() => {
    if (existingRef.current && existingGraphData.nodes.length) {
      existingRef.current.zoomToFit(100, 150);
    }
  }, [existingGraphData]);

  // Build network graph data from result.predicted_links
  useEffect(() => {
    if (!result?.predicted_links) return;

    const rawLinks = result.predicted_links.map(l => ({
      source: l.source,
      target: l.target,
      type:   l.link_type,
      probability: l.probability
    }));

    // group indices by source-target pair
    const groups = {};
    rawLinks.forEach((l, idx) => {
      const key = `${l.source}-${l.target}`;
      groups[key] = groups[key] || [];
      groups[key].push(idx);
    });

    // assign curvature per link in group
    const links = rawLinks.map((l, idx) => {
      const key = `${l.source}-${l.target}`;
      const idxs = groups[key];
      const pos = idxs.indexOf(idx);
      const count = idxs.length;
      const spread = 0.2; // spacing between curves
      const curvature = count > 1 ? (pos - (count - 1) / 2) * spread : 0;
      return { ...l, curvature };
    });

    // build unique node list
    const nodeIds = Array.from(
      new Set( links.flatMap(l => [l.source, l.target]) )
    );
    const nodes = nodeIds.map(id => {
      const s = students.find(st => st.student_id === id);
      return { id, name: s ? s.name : id.toString() };
    });

    setPredictedGraphData({ nodes, links });
  }, [result, students]);

  // Auto-fit predicted graph on update
  useEffect(() => {
    if (predictedRef.current && predictedGraphData.nodes.length) {
      predictedRef.current.zoomToFit(100, 150);
    }
  }, [predictedGraphData]);

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

              {/* New Network Graph Section */}
              <Divider mb={4} />
              <Flex justify="center" gap={8} wrap="wrap">
                {/* Existing Relationships */}
                <Box w={{ base: '100%', md: '45%' }} h="400px" position="relative" overflow="hidden">
                  <Heading size="sm" mb={2}>Existing Relationships</Heading>
                  <ForceGraph2D
                    ref={existingRef}
                    enableZoomPanInteraction={true}
                    enableNodeDrag={true}
                    width={450}
                    height={400}
                    graphData={existingGraphData}
                    nodeLabel="name"
                    nodeRelSize={5}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.005}
                    linkLabel={link => `${link.type}`}
                    linkWidth={link => (link.type === 'disrespect' ? 2 : 1)}
                    linkColor={link => REL_COLORS[link.type] || '#999'}
                    linkCurvature={link => link.curvature}
                    onEngineStop={() => {
                      existingRef.current.zoomToFit(150, 100);
                      existingRef.current.pauseAnimation();
                    }}
                  />
                </Box>

                {/* Predicted Relationships */}
                <Box w={{ base: '100%', md: '45%' }} h="400px" position="relative" overflow="hidden">
                  <Heading size="sm" mb={2}>Predicted Relationships</Heading>
                  <ForceGraph2D
                    ref={predictedRef}
                    enableZoomPanInteraction={true}
                    enableNodeDrag={true}
                    width={450}
                    height={400}
                    graphData={predictedGraphData}
                    nodeLabel="name"
                    nodeRelSize={5}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.005}
                    linkLabel={link => `${link.type}(${link.probability*100}%)`}
                    linkWidth={link => (link.type === 'disrespect' ? 2 : 1)}
                    linkColor={link => REL_COLORS[link.type] || '#999'}
                    linkCurvature={link => link.curvature}
                    onEngineStop={() => {
                      predictedRef.current.zoomToFit(150, 100);
                      predictedRef.current.pauseAnimation();
                    }}
                  />
                  
                </Box>
              </Flex>
              {/* Legend */}
              <Text fontWeight='bold' mt={2}>Relationships:</Text>
                                <HStack spacing={4} wrap="wrap" align="center" mb={4}>
                                  {Object.entries(REL_COLORS).map(([type, color]) => (
                                    <HStack key={type} spacing={2} align="center">
                                      <Box
                                        w="24px"
                                        h="6px"
                                        bg={color}
                                        borderRadius="full"
                                      />
                                      <Text fontSize="sm">
                                        {type
                                          .replace('_', ' ')
                                          .replace(/\b\w/g, l => l.toUpperCase())
                                        }
                                      </Text>
                                    </HStack>
                                  ))}
                                </HStack>
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default ManualOverride;
