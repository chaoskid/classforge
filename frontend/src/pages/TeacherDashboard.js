// src/pages/Allocations.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Divider,
  Button,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';
import { useNavigate } from 'react-router-dom';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Empty graph data
const emptyGraphData = {
  labels: [''],
  datasets: [
    {
      label: 'Empty Data',
      data: [0],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
    },
  ],
};

const emptyGraphOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
  },
  scales: {
    x: { display: false },
    y: { display: false },
  },
};

// Graph Card Component
const GraphCard = ({ title, data }) => (
  <Box
    p={4}
    borderWidth="1px"
    borderRadius="lg"
    boxShadow="md"
    height="300px"
    display="flex"
    flexDirection="column"
    justifyContent="space-between"
  >
    <Box flex="1" position="relative">
      <Line
        data={data?.labels ? data : emptyGraphData}
        options={emptyGraphOptions}
        style={{ height: '100%' }}
      />
    </Box>
    <Heading size="sm" mt={2} textAlign="center">
      {title}
    </Heading>
  </Box>
);

const Allocations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const [graphData, setGraphData] = React.useState({
    graph1: {},
    graph2: {},
    graph3: {},
    graph4: {},
    graph5: {},
  });

  // Fetch Graph Data once component mounts
  React.useEffect(() => {
    const fetchGraphs = async () => {
      try {
        const [res1, res2, res3, res4, res5] = await Promise.all([
          axios.get('/api/graph1'),
          axios.get('/api/graph2'),
          axios.get('/api/graph3'),
          axios.get('/api/graph4'),
          axios.get('/api/graph5'),
        ]);

        setGraphData({
          graph1: res1.data,
          graph2: res2.data,
          graph3: res3.data,
          graph4: res4.data,
          graph5: res5.data,
        });
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
      }
    };

    fetchGraphs();
  }, []);

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
        <Container maxW="6xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">

          {/* Visualization Section */}
          <Heading size="lg" mb={6}>Visualizations</Heading>
          <SimpleGrid columns={[1, 2, 3]} spacing={6} mb={12}>
            <GraphCard title="Visualization 1" data={graphData.graph1} />
            <GraphCard title="Visualization 2" data={graphData.graph2} />
            <GraphCard title="Visualization 3" data={graphData.graph3} />
            <GraphCard title="Visualization 4" data={graphData.graph4} />
            <GraphCard title="Visualization 5" data={graphData.graph5} />
          </SimpleGrid>

          {/* Allocations Section */}
          <Heading size="lg" mb={4}>Allocations</Heading>
          <Divider mb={6} />
          <SimpleGrid columns={[1, 2, 4]} spacing={6} mb={10}>
            <Button colorScheme="blue" onClick={handleAllocate} isLoading={loading}>
              Allocate Students
            </Button>
            <Button colorScheme="blue" onClick={() => handleInProgress('Manual Override')}>
              Manual Override
            </Button>
            <Button colorScheme="blue" onClick={() => handleInProgress('Reallocation Pool')}>
              Re-allocation Pool
            </Button>
            <Button colorScheme="blue" onClick={() => handleInProgress('Feedback')}>
              Feedback
            </Button>
          </SimpleGrid>

          {/* Students Options */}
          <Heading size="md" mb={2}>Students Options</Heading>
          <Divider mb={4} />
          <HStack spacing={6} mb={10}>
            <Button colorScheme="purple" onClick={() => handleInProgress('View Students')}>
              View Students
            </Button>
          </HStack>

          {/* Classes Options */}
          <Heading size="md" mb={2}>Classes Options</Heading>
          <Divider mb={4} />
          <HStack spacing={6}>
            <Button colorScheme="teal" onClick={() => handleInProgress('View Classes')}>
              View Classes
            </Button>
            <Button colorScheme="teal" onClick={() => handleInProgress('Allocation Summary (click Allocate Students to see the summary)')}>
              Allocation Summary
            </Button>
          </HStack>

        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default Allocations;