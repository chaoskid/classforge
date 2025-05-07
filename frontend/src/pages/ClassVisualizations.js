// src/pages/ClassVisualizations.js

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Select,
  Wrap,
  WrapItem,
  Badge,
  SimpleGrid,
  Flex,
  Text
} from '@chakra-ui/react';
import axios from './axiosConfig';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import ForceGraph2D from 'react-force-graph-2d';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const COLOR_PALETTE = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];
const REL_COLORS = {
  friends: '#2ca02c', influence: '#1f77b4', feedback: '#9467bd',
  more_time: '#ff7f0e', advice: '#17becf', disrespect: '#d62728'
};

const ClassVisualizations = () => {
  const [classes, setClasses] = useState([]);
  const [radarClass, setRadarClass] = useState(null);
  const [networkClass, setNetworkClass] = useState(null);
  const [relFilter, setRelFilter] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const navigate = useNavigate();

  // Load all classes once
  useEffect(() => {
    axios.get('/api/allocation-summary')
      .then(res => {
        setClasses(res.data);
        if (res.data.length) {
          setRadarClass(res.data[0].class_id);
          setNetworkClass(res.data[0].class_id);
        }
      })
      .catch(console.error);
  }, []);

  // Radar data for selected radarClass
  const selectedRadar = useMemo(() =>
    classes.find(c => c.class_id === +radarClass) || null,
    [classes, radarClass]
  );

  // Fetch relationship graph when networkClass or relFilter changes
  useEffect(() => {
    if (networkClass) {
      axios.get('/api/class-relationships', {
        params: { class_id: networkClass, relationship: relFilter }
      })
        .then(res => setGraphData(res.data))
        .catch(console.error);
    }
  }, [networkClass, relFilter]);

  // Map classes to colors
  const classColorMap = useMemo(() => {
    const map = {};
    classes.forEach((c, i) => map[c.class_label] = COLOR_PALETTE[i % COLOR_PALETTE.length]);
    return map;
  }, [classes]);

  // Radar chart metrics
  const metrics = [
    { label: 'Engagement', alloc: 'alloc_academic_engagement_score', target: 'target_academic_engagement_score' },
    { label: 'Wellbeing', alloc: 'alloc_academic_wellbeing_score', target: 'target_academic_wellbeing_score' },
    { label: 'Gender Norm', alloc: 'alloc_gender_norm_score', target: 'target_gender_norm_score' },
    { label: 'Growth Mindset', alloc: 'alloc_growth_mindset_score', target: 'target_growth_mindset_score' },
    { label: 'Mental Health', alloc: 'alloc_mental_health_score', target: 'target_mental_health_score' },
    { label: 'School Env', alloc: 'alloc_school_environment_score', target: 'target_school_environment_score' },
    { label: 'Social Attitude', alloc: 'alloc_social_attitude_score', target: 'target_social_attitude_score' }
  ];

  // Prepare radar chart
  const radarData = selectedRadar && {
    labels: metrics.map(m => m.label),
    datasets: [
      { label: 'Actual', data: metrics.map(m => selectedRadar[m.alloc]), backgroundColor: 'rgba(54,162,235,0.2)', borderColor: 'rgba(54,162,235,1)' },
      { label: 'Target', data: metrics.map(m => selectedRadar[m.target]), backgroundColor: 'rgba(255,99,132,0.2)', borderColor: 'rgba(255,99,132,1)' }
    ]
  };
  const radarOptions = { responsive: true, scales: { r: { beginAtZero: true, min: 0, max: 1, ticks: { stepSize: 0.25 } } }, plugins: { legend: { position: 'bottom' } } };

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
          <SimpleGrid columns={[1,2]} spacing={8}>

            {/* Radar Chart Card */}
            <Box borderWidth='1px' borderRadius='md' p={6} bg='gray.50'>
              <Heading size='md' mb={4}>Balance Radar Chart</Heading>
              <Select mb={4} value={radarClass || ''} onChange={e => setRadarClass(e.target.value)}>
                {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_label}</option>)}
              </Select>
              {selectedRadar && (
                <Flex justify='center' mb={4}>
                  <Box w={['100%','80%','60%']} h='400px'>
                    <Radar data={radarData} options={radarOptions} />
                  </Box>
                </Flex>
              )}
              <Wrap>
                {selectedRadar && metrics.map(m => {
                  const a = selectedRadar[m.alloc], t = selectedRadar[m.target];
                  const pct = ((a - t) / t) * 100;
                  return (
                    <WrapItem key={m.label}>
                      <Badge colorScheme={pct >= 0 ? 'green' : 'red'}>
                        {`${m.label}: ${pct.toFixed(1)}%`}
                      </Badge>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </Box>

            {/* Network Chart Card */}
            <Box borderWidth='1px' borderRadius='md' p={6} bg='gray.50'>
              <Heading size='md' mb={4}>Student Relationship Network</Heading>
              <Flex mb={4} gap={4}>
                <Box flex='1'>
                  <Text mb={1}>Class:</Text>
                  <Select value={networkClass || ''} onChange={e => setNetworkClass(e.target.value)}>
                    {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_label}</option>)}
                  </Select>
                </Box>
                <Box flex='1'>
                  <Text mb={1}>Relationship:</Text>
                  <Select value={relFilter} onChange={e => setRelFilter(e.target.value)}>
                    <option value=''>All</option>
                    {Object.keys(REL_COLORS).map(rt => <option key={rt} value={rt}>{rt}</option>)}
                  </Select>
                </Box>
              </Flex>
              <Flex justify='center' mb={4}>
                <Box w='100%' maxW='600px' h='400px'>
                  <ForceGraph2D
                    width={600}
                    height={400}
                    graphData={graphData}
                    nodeLabel='id'
                    nodeColor={n => classColorMap[n.class_label]}
                    linkColor={l => REL_COLORS[l.link_type] || '#999'}
                  />
                </Box>
              </Flex>
              <Text fontWeight='bold' mb={2}>Relationship Types:</Text>
              <Wrap mb={4}>{Object.entries(REL_COLORS).map(([k,v]) =>
                <WrapItem key={k}><Badge bg={v} color='white'>{k}</Badge></WrapItem>
              )}</Wrap>
              <Text fontWeight='bold' mb={2}>Classes:</Text>
              <Wrap>{classes.map((c,i) =>
                <WrapItem key={c.class_id}><Badge bg={COLOR_PALETTE[i % COLOR_PALETTE.length]} color='white'>{c.class_label}</Badge></WrapItem>
              )}</Wrap>
            </Box>

          </SimpleGrid>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default ClassVisualizations;
