// src/pages/Allocations.js
import React, { useEffect, useState }  from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Divider,
  Button,
  VStack,
  HStack,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
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
  BarElement,
  ArcElement,
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

// Graph Card Component
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
      datalabels: {display: false},
    },
    indexAxis: title === 'Student Feature Metrices' ? 'y' : 'x', // Make horizontal only for survey averages
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
        
      </Box>

      {/* Fullscreen Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box height="500px">
              <ChartComponent 
              data={safeData} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  datalabels: { display: true }
                }
              }}/>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const PieChartCard = ({ title, data }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // inline options/plugins exactly as requested
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', align: 'center' },
      title: { display: true, text: title },
      datalabels: {display: false},
    }
  };

  return (
    <>
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        boxShadow="md"
        bg="white"
        height="300px"
        display="flex"
        flexDirection="column"
        position="relative"
      >
        {/* Fullscreen button */}
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

        {/* Pie chart fills entire card */}
        <Box flex="1" position="relative">
          <Pie data={data} options={options} />
        </Box>
      </Box>

      {/* Fullscreen modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box height="600px">
              <Pie 
              data={data} 
              options={{
                ...options,
                plugins: {
                  ...options.plugins,
                  datalabels: { display: true }
                }
              }} />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const BarChartCard = ({ title, data }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // inline options/plugins exactly as before
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 1,
        ticks: { callback: v => (v * 100).toFixed(0) + '%' }
      }
    },
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: title },
      datalabels: { display: false },
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
        position="relative"
      >
        {/* Fullscreen button — same as other visuals */}
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

        {/* Chart */}
        <Box flex="1" position="relative">
          <Bar 
          data={data} 
          options={options} />
        </Box>
      </Box>

      {/* Fullscreen modal — same pattern as other visuals */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box height="600px">
              <Bar 
              data={data} 
              options={{
                ...options,
                plugins: {
                  ...options.plugins,
                  datalabels: { display: true }
                }
              }} />
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
  const [stats, setStats] = useState([]);
  const [graph2Data, setGraph2Data] = useState(null);
  const [graph4Data, setGraph4Data] = useState(null);

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

        const [res1, res2, res4] = await Promise.all([
          axios.get('/api/graph1'),
          axios.get('/api/graph2'),
          axios.get('/api/graph3')
        ]);
        setStats(res1.data);
        setGraph2Data(res2.data);

        const pieData = {
          labels: res4.data.labels,
          datasets: [
            {
              label: res4.data.datasets[0].label,
              data: res4.data.datasets[0].data,
              backgroundColor: res4.data.datasets[0].backgroundColor
            }
          ]
        };
        setGraph4Data(pieData);

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


  const handleAllocateClick = () => {
    navigate('/allocation-settings');
  };
  const handleManualOverride = () => {
    navigate('/manual-override');
  };
  const handleInProgress = (section) => alert(`${section} page is in progress`);

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">

          {/* Visualization Section */}
          <Heading size="lg" mb={6}>Dashboard</Heading>
          <SimpleGrid columns={[1, 2, 3]} spacing={6} mb={12}>
            
          <Box
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="md"
      bg="white"
      textAlign="left"
    >
      <VStack align="stretch" spacing={4}>
        {stats.map((stat, i) => (
          <Stat key={i}>
            <StatLabel fontSize="lg">{stat.label}</StatLabel>
            <StatNumber fontSize="2xl" color="blue.700">
              {stat.value}
            </StatNumber>
          </Stat>
        ))}
      </VStack>
    </Box>


            {graph2Data && (
      <BarChartCard
        title="Average scores of students in the unit"
        data={graph2Data}
      />
    )}
            <GraphCard title="Popular Clubs" data={graphData.graph3} type="bar" />
            {graph4Data && (
      <PieChartCard
        title="Relationship Distribution"
        data={graph4Data}
      />
    )}
            <GraphCard title="Student Feature Metrices" data={graphData.graph5} type="bar" />
          </SimpleGrid>

          {/* Allocations Section */}
          <Heading size="lg" mb={4}>Allocations</Heading>
          <Divider mb={6} />
          <SimpleGrid columns={[1, 2, 4]} spacing={6} mb={10}>
            <Button colorScheme="blue" onClick={handleAllocateClick} isLoading={loading}>
              Allocate Students
            </Button>
            <Button colorScheme="blue" onClick={handleManualOverride}>
              Manual Override
            </Button>
            <Button colorScheme="blue" onClick={() => handleInProgress('Reallocation Pool')}>
              Re-allocation Pool
            </Button>
            <Button colorScheme="blue" onClick={() => navigate('/teacher-feedback')}>
              Feedback
            </Button>

          </SimpleGrid>

          {/* Students Options */}
          <Heading size="md" mb={2}>View Students</Heading>
          <Divider mb={4} />
          <HStack spacing={6} mb={10}>
            <Button colorScheme="purple" onClick={() => navigate('/student-visualizations')}>
              Students
            </Button>
          </HStack>

          {/* Classes Options */}
          <Heading size="md" mb={2}>Allocated Classes</Heading>
          <Divider mb={4} />
          <HStack spacing={6}>
            <Button colorScheme="teal" onClick={() => navigate('/class-visualizations')}>
              Classes
            </Button>
            <Button colorScheme="teal" onClick={() => navigate('/allocation-results')}>
              Previous Allocation Summary
            </Button>
          </HStack>

        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default Allocations;