// src/pages/Allocations.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Divider,
  Button,
  HStack,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { Line, Bar } from 'react-chartjs-2';
import {
  BarElement,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Fullscreen } from 'lucide-react';

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
  Legend,
  BarElement
);

// Empty graph data fallback
const emptyGraphData = {
  labels: [''],
  datasets: [
    {
      label: 'Empty',
      data: [0],
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
    },
  ],
};

const GraphCard = ({ title, data, type = 'line' }) => {
  const ChartComponent = type === 'bar' ? Bar : Line;
  const { isOpen, onOpen, onClose } = useDisclosure();

  const safeData = data?.labels && data?.datasets ? data : emptyGraphData;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: { enabled: true },
      legend: { display: type === 'bar' ? false : true },
      title: { display: true, text: title },
    },
    indexAxis: title === 'Survey Averages' ? 'y' : 'x', // Make horizontal only for survey averages
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <>
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        boxShadow="md"
        height="300px"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        position="relative"
      >
        <IconButton
          icon={<Fullscreen size={16} />}
          size="sm"
          variant="ghost"
          colorScheme="gray"
          position="absolute"
          top={2}
          right={2}
          onClick={onOpen}
          aria-label="Fullscreen"
        />
        <Box flex="1" position="relative">
          <ChartComponent data={safeData} options={chartOptions} />
        </Box>
        <Heading size="sm" mt={2} textAlign="center">
          {title}
        </Heading>
      </Box>

      {/* Fullscreen Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box height="500px">
              <ChartComponent data={safeData} options={chartOptions} />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

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

  React.useEffect(() => {
    const fetchGraphs = async () => {
      try {
        // Fetch top clubs data for graph 3
        const res3 = await axios.get('/api/top-clubs');
        const topClubs = res3.data;
        const labels = topClubs.map(c => c.club_name);
        const values = topClubs.map(c => c.count);

        const graph3Data = {
          labels,
          datasets: [{
            label: 'Top Clubs',
            data: values,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        };

        // Fetch survey averages for graph 5
        const res5 = await axios.get('/api/survey-averages');
        const surveyData = res5.data;

        // Sort by absolute value to show most significant responses first
        const sortedData = [...surveyData].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

        const graph5Data = {
          labels: sortedData.map(item => item.label),
          datasets: [{
            label: 'Survey Score',
            data: sortedData.map(item => item.value),
            backgroundColor: sortedData.map(item =>
              item.value >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
            ),
            borderColor: sortedData.map(item =>
              item.value >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
            ),
            borderWidth: 1
          }]
        };

        setGraphData(prev => ({
          ...prev,
          graph3: graph3Data,
          graph5: graph5Data
        }));

      } catch (err) {
        console.error('API Error:', err);
      }
    };

    fetchGraphs();
  }, []);

  const handleAllocate = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/allocate');
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
          <Heading size="lg" mb={6}>Visualizations</Heading>
          <SimpleGrid columns={[1, 2, 3]} spacing={6} mb={12}>
            <GraphCard title="Visualization 1" data={graphData.graph1} />
            <GraphCard title="Visualization 2" data={graphData.graph2} />
            <GraphCard title="Top Clubs" data={graphData.graph3} type="bar" />
            <GraphCard title="Visualization 4" data={graphData.graph4} />
            <GraphCard title="Survey Averages" data={graphData.graph5} type="bar" />
          </SimpleGrid>

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

          <Heading size="md" mb={2}>Students Options</Heading>
          <Divider mb={4} />
          <HStack spacing={6} mb={10}>
            <Button colorScheme="purple" onClick={() => handleInProgress('View Students')}>
              View Students
            </Button>
          </HStack>

          <Heading size="md" mb={2}>Classes Options</Heading>
          <Divider mb={4} />
          <HStack spacing={6}>
            <Button colorScheme="teal" onClick={() => handleInProgress('View Classes')}>
              View Classes
            </Button>
            <Button colorScheme="teal" onClick={() => handleInProgress('Allocation Summary')}>
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