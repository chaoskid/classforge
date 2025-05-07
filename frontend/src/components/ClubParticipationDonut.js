// ClubParticipationDonut.js
import React from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ClubParticipationDonut = ({ studentClubs, popularClubs, allClubs }) => {
  const clubMap = {};
allClubs.forEach(club => {
  clubMap[club.club_name] = club.student_count || 0;
});

const data = popularClubs.map((club, index) => ({
  name: club,
  value: 1,
  student_count: clubMap[club] || 0,
}));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          dataKey="value"
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke={entry.joined ? '#000' : '#fff'} // bold outline if joined
              strokeWidth={entry.joined ? 2 : 1}
            />
          ))}
        </Pie>
        

        <Legend layout="horizontal" align="center" verticalAlign="bottom" />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ClubParticipationDonut;
