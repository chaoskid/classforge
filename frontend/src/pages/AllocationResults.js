// src/pages/AllocationResults.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
  Button,
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';

import { useNavigate } from 'react-router-dom';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
} from 'recharts';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js components + plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  ChartTooltip,
  ChartLegend,
  MatrixController,
  MatrixElement,
  ChartDataLabels,
  ArcElement
);

// Define the features we're tracking
const FEATURES = [
  { key: 'academic_engagement_score', label: 'Engagement' },
  { key: 'academic_wellbeing_score',  label: 'Wellbeing'  },
  { key: 'mental_health_score',       label: 'Mental Health' },
  { key: 'growth_mindset_score',      label: 'Growth Mindset' },
  { key: 'gender_norm_score',         label: 'Gender Norm' },
  { key: 'social_attitude_score',     label: 'Social Attitude' },
  { key: 'school_environment_score',  label: 'School Env' },
];
const REL_TYPES = [
    { key: 'friendships',    label: 'Friendships', color: 'green' },
    { key: 'advice',     label: 'Advice',      color: 'green' },
    { key: 'feedback',   label: 'Feedback',    color: 'green' },
    { key: 'disrespect', label: 'Disrespect',  color: 'red'   },
    { key: 'influence',  label: 'Influence',   color: 'green' },
    { key: 'more_time',  label: 'More Time',   color: 'green' },
  ];

const AllocationResults = () => {
  const [allocationSummary, setAllocationSummary] = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState('');
  const navigate = useNavigate();

  // Fetch allocation summary on mount
  useEffect(() => {
    axios
      .get('/api/allocation-summary')
      .then(res => {
        setAllocationSummary(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load allocation summary');
        setLoading(false);
      });
  }, []);

  // Bar chart data
  const barData = useMemo(
    () =>
      allocationSummary.map(row => ({
        class:    row.class_label,
        students: Number(row.student_count) || 0,
      })),
    [allocationSummary]
  );

  // Heatmap raw data
  const heatmapData = useMemo(() => {
    const data = [];
    allocationSummary.forEach(row => {
      const classLabel = row.class_label;
      FEATURES.forEach(feat => {
        const allocVal  = Number(row[`alloc_${feat.key}`])  || 0;
        const targetVal = Number(row[`target_${feat.key}`]) || 0;
        const deviation =
          targetVal > 0
            ? Math.abs((allocVal - targetVal) / targetVal) * 100
            : 0;
        data.push({
          x:      feat.label,
          y:      classLabel,
          v:      deviation,
          alloc:  allocVal,
          target: targetVal,
        });
      });
    });
    return data;
  }, [allocationSummary]);

  // Max deviation for color scaling
  const maxDeviation = useMemo(
    () => heatmapData.reduce((max, cell) => Math.max(max, cell.v || 0), 0),
    [heatmapData]
  );

  // Chart.js dataset
  const heatmapChartData = {
    datasets: [
      {
        label: 'Score Deviation (%)',
        data:  heatmapData,
        backgroundColor: ctx => {
          const v = ctx.raw?.v || 0;
          const ratio = maxDeviation > 0 ? v / maxDeviation : 0;
          const r = Math.round(255 * ratio);
          const g = Math.round(255 * (1 - ratio));
          return `rgb(${r},${g},0)`;
        },
        borderWidth: 1,
        width:  ctx =>
          (ctx.chart.chartArea?.width  || 0) / FEATURES.length,
        height: ctx =>
          (ctx.chart.chartArea?.height || 0) / allocationSummary.length,
      },
    ],
  };

  // Chart.js options with safe datalabels.formatter
  const heatmapOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: items => {
            const raw = items[0].raw;
            return `${raw.y} — ${raw.x}`;
          },
          label: item => {
            const raw = item.raw;
            return [
              `Deviation: ${raw.v.toFixed(1)}%`,
              `Alloc: ${raw.alloc.toFixed(3)}`,
              `Target: ${raw.target.toFixed(3)}`,
            ];
          },
        },
      },
      datalabels: {
        color: 'white',
        font: { weight: 'bold' },
        formatter: (_value, ctx) => {
          const raw = ctx.raw;
          if (!raw || typeof raw.v !== 'number') return '';
          return raw.v.toFixed(1);
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        labels: FEATURES.map(f => f.label),
        offset: true,
        grid: { display: false },
      },
      y: {
        type: 'category',
        labels: allocationSummary.map(r => r.class_label),
        offset: true,
        grid: { display: false },
      },
    },
  };
  const donutOptions = {
    maintainAspectRatio: false,
    cutout: '30%',
    plugins: {
      legend: { display: false },
      tooltip: { /* … */ },
  
      datalabels: {
        anchor: 'center',
        align: 'center',
        font: { weight: 'bold' },
        // dynamically pick white for the colored slice, black for the light grey
        color: ctx =>
          ctx.dataset.backgroundColor[ctx.dataIndex] === '#EDF2F7'
            ? 'black'
            : 'white',
        // always show the raw value
        formatter: (value) => value
      }
    }
  };

  // Loading or error states
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
  if (error) {
    return (
      <>
        <Navbar />
        <Box bg="gray.100" minH="100vh" py={10} textAlign="center">
          <Text color="red.500">{error}</Text>
        </Box>
        <Footer />
      </>
    );
  }

  // Main render
  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
        <Button mb={4} onClick={() => navigate(-1)} colorScheme="blue">
                    &larr; Back
                  </Button>
          <Heading size="lg" mb={6}>Allocation Results</Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} mb={10} gridAutoRows="1fr" >
    {/* --- Bar Chart --- */}
    <Box>
      <Heading size="md" mb={4}>Students per Class</Heading>
      <Box h="500px">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="class" />
            <YAxis />
            <RechartTooltip />
            <Bar dataKey="students" fill="#3182CE" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>

    {/* --- Heatmap --- */}
    <Box>
      <Heading size="md" mb={4}>Score Deviations (%)</Heading>
      <Box h="500px">
        <Chart
          type="matrix"
          data={heatmapChartData}
          options={heatmapOptions}
        />
      </Box>
    </Box>
  </SimpleGrid>

          <Heading size="md" mb={4}>Relationship Retention</Heading>
          <Box overflowX="auto" mb={20}>
  <SimpleGrid columns={REL_TYPES.length + 1} spacing={4} alignItems="center" py={5}>
    {/* Header row: blank cell + one per rel type */}
    <Box />
    {REL_TYPES.map(rt => (
      <Box key={rt.key} textAlign="center" mb={5}>
        <Text fontWeight="bold">{rt.label}</Text>
      </Box>
    ))}

    {/* One row per class */}
    {allocationSummary.map(row => (
      <React.Fragment key={row.class_label}>
        {/* Class label */}
        <Box textAlign="center">
          <Text fontWeight="semibold">{row.class_label}</Text>
        </Box>

        {/* One donut per relationship type */}
        {REL_TYPES.map(rt => {
          const total    = Number(row[`total_${rt.key}`]) || 0;
          const retained = Number(row[`num_${rt.key}`])   || 0;
          const dropped  = Math.max(total - retained, 0);
          const colors   =
            rt.key === 'disrespect'
              ? ['red',   '#EDF2F7']
              : [rt.color, '#EDF2F7'];

          return (
            <Box key={rt.key} width="120px" height="120px">
              <Chart
                type="doughnut"
                data={{
                  labels: ['Retained','Dropped'],
                  datasets: [{
                    data: [retained, dropped],
                    backgroundColor: colors,
                    borderWidth: 1,
                  }],
                }}
                options={donutOptions}
              />
            </Box>
          );
        })}
      </React.Fragment>
    ))}
  </SimpleGrid>
</Box>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default AllocationResults;
