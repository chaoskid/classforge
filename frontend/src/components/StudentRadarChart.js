// src/components/StudentRadarChart.js

import React from 'react';
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

const StudentRadarChart = ({ scores }) => {
  if (!scores) return null;

  const data = {
    labels: [
      'Academic Engagement',
      'Academic Wellbeing',
      'Mental Health',
      'Growth Mindset',
      'Gender Norms',
      'Social Attitude',
      'School Environment'
    ],
    datasets: [
      {
        label: 'Score',
        data: [
          scores.academic_engagement_score,
          scores.academic_wellbeing_score,
          scores.mental_health_score,
          scores.growth_mindset_score,
          scores.gender_norm_score,
          scores.social_attitude_score,
          scores.school_environment_score
        ],
        backgroundColor: 'rgba(10, 47, 92, 0.2)',
        borderColor: '#0a2f5c',
        borderWidth: 2,
        pointBackgroundColor: '#0a2f5c'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 1,
        ticks: {
          stepSize: 0.25
        }
      }
    }
  };

  return <Radar data={data} options={options} />;
};

export default StudentRadarChart;
