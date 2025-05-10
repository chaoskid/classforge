// src/pages/ClassVisualizations.js

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Select,
  Flex,
  Text,
  List,
  ListItem,
  SimpleGrid,
  Wrap,
  WrapItem,
  Badge,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  position,
  Avatar,
  Divider
} from '@chakra-ui/react';
import axios from '../pages/axiosConfig';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import ForceGraph2D from 'react-force-graph-2d';
import { ViewIcon } from '@chakra-ui/icons';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale, 
  LinearScale, 
  BarElement,
  plugins
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Radar } from 'react-chartjs-2';
import { px } from 'framer-motion';
import plugin from 'chartjs-plugin-datalabels';

// Register Chart.js components and plugins
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels,
  CategoryScale, 
  LinearScale, 
  BarElement
);

// Color mappings
const COLOR_PALETTE = [
  '#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2'
];
const REL_COLORS = {
  friends:    '#2ca02c',
  influence:  '#1f77b4',
  feedback:   '#9467bd',
  more_time:  '#ff7f0e',
  advice:     '#17becf',
  disrespect: '#d62728'
};

export default function ClassVisualizations() {
  // state hooks
  const [classes, setClasses]             = useState([]);
  const [radarClass, setRadarClass]       = useState(null);
  const [networkClass, setNetworkClass]   = useState(null);
  const [relFilter, setRelFilter]         = useState('');
  const [graphData, setGraphData]         = useState({ nodes: [], links: [] });
  const [behavioralStudents, setBehavioral]     = useState([]);
  const [mentalHealthStudents, setMentalHealth] = useState([]);
  const [relCounts, setRelCounts]               = useState({});
  const fgRef = useRef();
  const navigate = useNavigate();
  const handleStudentClick = id => {
    navigate('/student-visualizations', {
      state: { selectedStudent: id }
    });
  };

  // load class list
  useEffect(() => {
    axios.get('/api/allocation-summary')
      .then(res => {
        setClasses(res.data);
        if (res.data.length) {
          setRadarClass(res.data[0].class_id);
          setNetworkClass(res.data[0].class_id)
        }
      })
      .catch(console.error);
  }, []);

  // metrics for radar
  const metrics = [
    { label: 'Engagement',    alloc: 'alloc_academic_engagement_score',    target: 'target_academic_engagement_score' },
    { label: 'Wellbeing',     alloc: 'alloc_academic_wellbeing_score',     target: 'target_academic_wellbeing_score' },
    { label: 'Gender Norm',   alloc: 'alloc_gender_norm_score',           target: 'target_gender_norm_score' },
    { label: 'Growth Mindset',alloc: 'alloc_growth_mindset_score',        target: 'target_growth_mindset_score' },
    { label: 'Mental Health', alloc: 'alloc_mental_health_score',         target: 'target_mental_health_score' },
    { label: 'School Env',    alloc: 'alloc_school_environment_score',    target: 'target_school_environment_score' },
    { label: 'Social Attitude',alloc: 'alloc_social_attitude_score',      target: 'target_social_attitude_score' }
  ];

  // prepare radar data
  const radarData = useMemo(() => {
    const sel = classes.find(c => c.class_id === +radarClass) || {};
    return {
      labels: metrics.map(m => m.label),
      datasets: [
        {
          label: 'Actual Score',
          data: metrics.map(m => sel[m.alloc] || 0),
          backgroundColor: 'rgba(54,162,235,0.2)',
          borderColor: 'rgba(54,162,235,1)'
        },
        {
          label: 'Target Score',
          data: metrics.map(m => sel[m.target] || 0),
          backgroundColor: 'rgba(255,99,132,0.2)',
          borderColor: 'rgba(255,99,132,1)'
        }
      ]
    };
  }, [classes, radarClass]);

  const radarOptions = {
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          display: false
        }
      }
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: false
      }
    }
  };

  // fetch network graph
  useEffect(() => {
    if (networkClass == null) return;
    axios.get('/api/class-relationships', { params: { class_id: networkClass, relationship: relFilter || undefined } })
      .then(res => setGraphData(res.data))
      .catch(console.error);
  }, [networkClass, relFilter]);

  useEffect(() => {
    if (fgRef.current && graphData.nodes.length) {
      fgRef.current.zoomToFit(120, 800);
    }
  }, []);

  // fetch behavioral support list
  useEffect(() => {
    if (radarClass == null) return;
    axios.get('/api/class-behavioral-support', { params: { class_id: radarClass } })
      .then(res => setBehavioral(res.data))
      .catch(console.error);
  }, [radarClass]);

  // fetch mental health list
  useEffect(() => {
    if (radarClass == null) return;
    axios.get('/api/class-mental-health-priority', { params: { class_id: radarClass } })
      .then(res => setMentalHealth(res.data))
      .catch(console.error);
  }, [radarClass]);

  // fetch relationship counts
  useEffect(() => {
    if (radarClass == null) return;
    axios.get('/api/class-relationship-counts', { params: { class_id: radarClass } })
      .then(res => setRelCounts(res.data))
      .catch(console.error);
  }, [radarClass]);

  return (
    <>
      <Navbar />
      <Box bg='gray.100' py={10} minH='100vh'>
        <Container maxW='6xl' bg='white' p={8} borderRadius='lg' boxShadow='lg'>
          <Button colorScheme="blue" onClick={() => navigate(-1)}>
                          Back
                        </Button>
                  
                <Box minH="3vh"></Box>
          <Heading mb={6}>Class Visualizations</Heading>
          {/* --- GLOBAL CLASS SELECTOR --- */}
          <Select
            mb={6}
            bg='white'
            w="200px"
            value={radarClass || ''}
            onChange={e => {
              setRadarClass(e.target.value);
              setNetworkClass(e.target.value);
            }}
          >
            {classes.map(c => (
              <option key={c.class_id} value={c.class_id}>
                {c.class_label}
              </option>
            ))}
          </Select>

          {/* Grid for Radar & Network */}
          <SimpleGrid columns={[1,2]} spacing={6} mb={6}>

            {/* Radar Chart Card */}
            <Box borderWidth='1px' borderRadius='md' p={6} bg='white'>
              <Heading size='md' mb={4}>Target Vs. Actual Class Metrics</Heading>
              <Flex justify='center'>
                <Box w={['100%','90%','70%']} h='350px'>
                  <Radar data={radarData} options={radarOptions} />
                </Box>
              </Flex>

              {/* Score Differences Badges */}
              <Text fontWeight='bold' fontSize='sm' mt={4} mb={2}>Score Differences (Target vs. Actual)</Text>
              <Wrap>
                {metrics.map(m => {
                  const sel = classes.find(c => c.class_id === +radarClass) || {};
                  const a = sel[m.alloc] || 0;
                  const t = sel[m.target] || 0;
                  const diff = t ? ((a - t) / t) * 100 : 0;
                  return (
                    <WrapItem key={m.label}>
                      <Badge colorScheme={diff >= 0 ? 'green' : 'red'}
                        fontSize='xs'>
                        {`${m.label}: ${diff.toFixed(1)}%`}
                      </Badge>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </Box>
            {/* Relationship Distribution Bar */}
            <Box borderWidth='1px' borderRadius='md' p={6} bg='white'>
              <Heading size='md' mb={4}>Total Number of Various Relationship Types in the Class</Heading>
              <Flex justify="flex-start">
              <Box w={['100%','80%','70%']} h="400px" maxW="800px">
                <Bar
                  data={{
                    labels: ['Friends','More Time','Advice','Feedback','Influence','Disrespect'],
                    datasets: [{
                      data: [
                        relCounts.friends    || 0,
                        relCounts.more_time  || 0,
                        relCounts.advice     || 0,
                        relCounts.feedback   || 0,
                        relCounts.influence  || 0,
                        relCounts.disrespect || 0
                      ],
                      backgroundColor: Object.values(REL_COLORS),
                      borderRadius: 4,
                      barThickness: 24
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    maintainAspectRatio: false,
                    layout: {
                      padding: { top: 10, right: 20, bottom: 10, left: 10 }
                    },
                    scales: {
                      x: { 
                        beginAtZero: true,
                        grid: { display: false }
                      },
                      y: {
                        ticks: { font: { size: 14 } },
                        grid: { display: false }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          title: tooltipItems => tooltipItems[0].label,
                          label: ctx => `Count: ${ctx.parsed.x}`
                        }
                      },
                      datalabels: {
                        display: false
                      }
                    }
                  }}
                  redraw
                />
              </Box>
              </Flex>
            </Box>
          </SimpleGrid>
          {/* Network Chart Card */}
          <Box borderWidth='1px' borderRadius='md' p={6} bg='white'>
              <Heading size='md' mb={4}>Student Relationship Network</Heading>
              <Flex mb={4} gap={4}>
                <Select flex='1' value={relFilter} onChange={e => setRelFilter(e.target.value)}>
                  <option value=''>All Relationships</option>
                  {Object.keys(REL_COLORS).map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </Select>
              </Flex>
              <Flex justify='center'>
                  <Box px={0} w='100%' maxW='900px' h='400px' mx='auto' position='relative' overflow='hidden'>
                    <ForceGraph2D
                      enableZoomPanInteraction={true}
                      enableNodeDrag={true}
                      ref={fgRef}
                      width={900}
                      height={400}
                      graphData={graphData}
                      nodeLabel={node => `${node.first_name} ${node.last_name}`}
                      nodeRelSize={8}
                      nodeAutoColorBy='class_label'
                      linkColor={l => REL_COLORS[l.link_type] || '#999'}
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
          {/* At Risk Students List */}
          <Box borderWidth='1px' borderRadius='md' p={6} bg='white' mb={6}>
            <Heading size='md' mb={4} textAlign='center'>At Risk Students List</Heading>
              <SimpleGrid columns={[1, null, 2]} spacing={6} mt={4}>
                <Box bg='white'  boxShadow='lg' p={4}>
                  <Heading size="sm" mb={2} textAlign='center'>Behavioral Support Priority</Heading>
                  {behavioralStudents.length ? (
                    <List spacing={0}>
                      {behavioralStudents.map((s, idx) => (
                        <ListItem key={s.student_id}>
                          <HStack justify="space-between" align="center" py={2}>
                          <HStack spacing={3}>
                            <Avatar name={`${s.first_name} ${s.last_name}`} size="sm" />
                            <Text>{s.first_name} {s.last_name}</Text>
                          </HStack>
                          <ViewIcon
                            boxSize={5}
                            cursor="pointer"
                            onClick={() => handleStudentClick(s.student_id)}
                            aria-label="View details"
                          />                          
                          </HStack>
                          {/* thin separator under every item except last */}
                          {idx < behavioralStudents.length - 1 && <Divider borderColor="gray.200" />}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Text>No students needing behavioral support in this class.</Text>
                  )}
                </Box>
                <Box bg='white' boxShadow='lg' p={4}>
                  <Heading size="sm" mb={2} textAlign='center'>Mental Health Priority</Heading>
                  {mentalHealthStudents.length ? (
                    <List spacing={2}>
                      {mentalHealthStudents.map((s, idx) => (
                        <ListItem key={s.student_id}>
                          <HStack justify="space-between" align="center" py={2}>
                          <HStack spacing={3}>
                            <Avatar name={`${s.first_name} ${s.last_name}`} size="sm" />
                            <Text>{s.first_name} {s.last_name}</Text>
                          </HStack>
                          <ViewIcon
                            boxSize={5}
                            cursor="pointer"
                            onClick={() => handleStudentClick(s.student_id)}
                            aria-label="View details"
                          />                          
                          </HStack>
                          {/* thin separator under every item except last */}
                          {idx < mentalHealthStudents.length - 1 && <Divider borderColor="gray.200" />}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Text>No high-priority mental health cases in this class.</Text>
                  )}
                </Box>
              </SimpleGrid>
            
          </Box>
        </Container>
      </Box>
      <Footer />
    </>
  );
}
