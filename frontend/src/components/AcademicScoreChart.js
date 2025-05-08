import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const AcademicScoreChart = ({ yourScore, classAvg }) => {
  const data = [
    { name: 'Individual Academic Score', score: yourScore || 0 },
    { name: 'Class Average Academic Score', score: classAvg || 0 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Bar dataKey="score" fill="#3182ce" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AcademicScoreChart;
