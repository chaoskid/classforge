// src/pages/Allocations.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { FaUserGraduate } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const StatCard = ({ label, value }) => (
  <Box
    p={6}
    borderWidth="1px"
    borderRadius="lg"
    boxShadow="md"
    bg="white"
    textAlign="center"
  >
    <Icon as={FaUserGraduate} w={10} h={10} color="blue.500" mb={2} />
    <Stat>
      <StatLabel fontSize="lg">{label}</StatLabel>
      <StatNumber fontSize="3xl" color="blue.700">{value}</StatNumber>
    </Stat>
  </Box>
);

const BarChartCard = ({ title, data }) => (
  <Box
    p={4}
    borderWidth="1px"
    borderRadius="lg"
    boxShadow="md"
    bg="white"
    height="300px"
  >
    <Heading size="sm" mb={2} textAlign="center">{title}</Heading>
    <Bar data={data} options={{ responsive: true, plugins: { legend: { position: 'top' }}}} />
  </Box>
);

const PieChartCard = ({ title, data }) => (
  <Box
    p={4}
    borderWidth="1px"
    borderRadius="lg"
    boxShadow="md"
    bg="white"
    height="300px"
  >
    <Heading size="sm" mb={2} textAlign="center">{title}</Heading>
    <Pie data={data} options={{ responsive: true, plugins: { legend: { position: 'bottom' }}}} />
  </Box>
);

const TeacherDashboard = () => {
  const [stats, setStats] = useState([]);
  const [graph2Data, setGraph2Data] = useState(null);
  const [graph3Data, setGraph3Data] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          axios.get('/api/graph1'),
          axios.get('/api/graph2'),
          axios.get('/api/graph3')
        ]);
        setStats(res1.data);
        setGraph2Data(res2.data);

        const pieData = {
          labels: res3.data.labels,
          datasets: [
            {
              label: res3.data.datasets[0].label,
              data: res3.data.datasets[0].data,
              backgroundColor: res3.data.datasets[0].backgroundColor
            }
          ]
        };
        setGraph3Data(pieData);
      } catch (err) {
        console.error('Error loading graphs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="6xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={6}>Visualizations</Heading>
          {loading ? <Spinner size="xl" /> : (
            <SimpleGrid columns={[1, 2, 2]} spacing={6} mb={12}>
              {stats.map((stat, i) => (
                <StatCard key={i} label={stat.label} value={stat.value} />
              ))}
              {graph2Data && <BarChartCard title="Visualization 2: Average Scores" data={graph2Data} />}
              {graph3Data && <PieChartCard title="Visualization 3: Relationship Distribution" data={graph3Data} />}
            </SimpleGrid>
          )}
          <Divider />
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default TeacherDashboard;
