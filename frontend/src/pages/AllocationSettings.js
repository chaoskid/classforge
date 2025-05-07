import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Button, HStack, Text, VStack,
  SimpleGrid, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Input
} from '@chakra-ui/react';
import axios from '../pages/axiosConfig';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const targetScores = [
  'academic_engagement_score',
  'academic_wellbeing_score',
  'gender_norm_score',
  'growth_mindset_score',
  'mental_health_score',
  'school_environment_score',
  'social_attitude_score',
];

export default function StudentAllocationSetup() {
  const [loading, setLoading] = useState(false);
  const [unallocatedStudents, setUnallocatedStudents] = useState(0);
  const [numClasses, setNumClasses] = useState(null);
  const [studentsPerClass, setStudentsPerClass] = useState(null);
  const [modelPath, setModelPath] = useState('');
  const [classLabels, setClassLabels] = useState([]);
  const [targetValues, setTargetValues] = useState([]);
  const [globalAverages, setGlobalAverages] = useState({});
  const [selectionMode, setSelectionMode] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStage() {
      try {
        const response = await axios.get('/api/stage_allocation');
        setUnallocatedStudents(response.data.number_of_unallocated_students);
        setGlobalAverages(response.data.global_averages);
      } catch (err) {
        console.error('Stage allocation fetch failed:', err);
      }
    }
    fetchStage();
    window.scrollTo(0, 0);
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.focus();
  }, []);

  const handleClassSelection = (count) => {
    setNumClasses(count);
    setStudentsPerClass(Math.floor(unallocatedStudents / count));
    setModelPath(`dq${count}.pth`);
    setClassLabels(
      Array.from({ length: count }, (_, i) => `class_${i}`)
    );
    setTargetValues(
      Array.from({ length: count }, () => {
        const obj = {};
        targetScores.forEach(score => (obj[score] = 0));
        return obj;
      })
    );
  };

  const handleSliderChange = (idx, scoreKey, value) => {
    const updated = [...targetValues];
    updated[idx] = { ...updated[idx], [scoreKey]: parseFloat((value / 100).toFixed(2)) };
    setTargetValues(updated);
  };

  const handleLabelChange = (idx, val) => {
    const updated = [...classLabels];
    updated[idx] = val;
    setClassLabels(updated);
  };

  const handleAllocate = async () => {
    if (!numClasses) {
      alert('Please select the number of classes');
      return;
    }
    setLoading(true);

    const payload = {
      model_path: modelPath,
      num_classes: numClasses,
      target_values: Array.from({ length: numClasses }, (_, i) => {
        const scores = {};
        targetScores.forEach(key => {
          scores[key] = selectionMode === 'balanced'
            ? globalAverages[key]
            : targetValues[i][key] || 0;
        });
        return {
          class_number: i + 1,
          class_label: classLabels[i],
          ...scores,
        };
      }),
    };

    try {
      const { data } = await axios.post('/api/allocate', payload);
      navigate('/allocation-results', { state: data });
    } catch (err) {
      console.error('Allocation error:', err);
      alert('Allocation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar id="navbar" tabIndex={-1} />
      <Box bg="gray.100" minH="100vh" py={10} pt={10}>
        <Container maxW="7xl" minH="90vh" bg="white" borderRadius="lg" boxShadow="lg" p={10}>
        <Button colorScheme="blue" onClick={() => navigate(-1)}>
                Back
              </Button>
        
      <Box minH="3vh"></Box>
          <VStack spacing={6} align="start">
            <Heading size="xl" fontWeight="bold">Customize Allocation</Heading>

            <HStack spacing={4} align="center">
              <Text fontSize="xl" fontWeight="semibold">
                Number of Unallocated Students: {unallocatedStudents}
              </Text>
            </HStack>

            <HStack spacing={4} align="center">
              <Text fontSize="xl" fontWeight="semibold">Select Number of Classes</Text>
              {[5, 7, 9].map(n => (
                <Button
                  key={n}
                  onClick={() => handleClassSelection(n)}
                  variant={numClasses === n ? 'solid' : 'outline'}
                  colorScheme="blue"
                >{n} Classes</Button>
              ))}
            </HStack>

            {studentsPerClass != null && (
              <Text>Each class will have around {studentsPerClass} students.</Text>
            )}

            <HStack spacing={4} align="center">
              <Text fontSize="xl" fontWeight="semibold">Set Target Scores</Text>
              {['balanced', 'custom'].map(mode => (
                <Button
                  key={mode}
                  onClick={() => setSelectionMode(mode)}
                  variant={selectionMode === mode ? 'solid' : 'outline'}
                  colorScheme="blue"
                >{mode.charAt(0).toUpperCase() + mode.slice(1)}</Button>
              ))}
            </HStack>

            {numClasses && selectionMode === 'balanced' && (
              <Box bg="gray.100" p={4} borderRadius="md" w="full">
                <Text fontWeight="bold">Balanced Target Scores (Global Average)</Text>
                {targetScores.map(key => (
                  <Box key={key} my={3}>
                    <HStack justify="space-between">
                      <Text>{key.replace(/_score$/, '').replace(/_/g, ' ').toUpperCase()}</Text>
                      <Text>{(globalAverages[key] * 100).toFixed(0)}%</Text>
                    </HStack>
                    <Slider value={globalAverages[key] * 100} isDisabled colorScheme="green">
                      <SliderTrack bg="blue.300">
                        <SliderFilledTrack bg="green.400" />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Box>
                ))}
              </Box>
            )}

            {numClasses && selectionMode === 'custom' && (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6} w="full">
                {Array.from({ length: numClasses }).map((_, i) => (
                  <Box key={i} bg="gray.100" p={4} borderRadius="md" w="full">
                    <Text fontWeight="bold">Class {i + 1} Target Scores</Text>
                    <Input
                      mb={4}
                      bg="white"
                      value={classLabels[i]}
                      onChange={e => handleLabelChange(i, e.target.value)}
                      placeholder={`Label for class_${i}`}
                    />
                    {targetScores.map(key => (
                      <Box key={key} my={2}>
                        <HStack justify="space-between">
                          <Text fontSize="sm">
                            {key.replace(/_score$/, '').replace(/_/g, ' ').toUpperCase()}
                          </Text>
                          <Text fontSize="sm">
                            {(targetValues[i][key] * 100 || 0).toFixed(0)}%
                          </Text>
                        </HStack>
                        <Slider
                          min={0}
                          max={100}
                          value={(targetValues[i][key] || 0) * 100}
                          onChange={val => handleSliderChange(i, key, val)}
                          colorScheme="green"
                        >
                          <SliderTrack bg="blue.300">
                            <SliderFilledTrack bg="green.400" />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                      </Box>
                    ))}
                  </Box>
                ))}
              </SimpleGrid>
            )}
            <Box minH="3vh"></Box>
            <Button
              colorScheme="green"
              onClick={handleAllocate}
              isLoading={loading}
              isDisabled={!numClasses}
            >Allocate Students</Button>
          </VStack>
        </Container>
      </Box>
      <Footer />
    </>
  );
}
