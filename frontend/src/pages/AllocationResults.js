// src/pages/AllocationResults.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  Divider,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AllocationResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { allocation_summary = [], message = '' } = location.state || {};

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Button mb={4} onClick={() => navigate(-1)} colorScheme="blue">
            &larr; Back
          </Button>

          <Heading size="lg" mb={2}>Allocation Results</Heading>
          {message && <Text mb={4}>{message}</Text>}
          <Divider mb={6} />

          
          {/* Class Features Table */}
          <Heading size="md" mt={6} mb={2}>Class Scores (Allocation / Target)</Heading>
          <Table variant="striped" size="sm" overflowX="auto">
            <Thead>
              <Tr>
                <Th>Class</Th>
                <Th>Count</Th>
                <Th>Engagement</Th>
                <Th>Wellbeing</Th>
                <Th>Gender Norm</Th>
                <Th>Growth Mindset</Th>
                <Th>Mental Health</Th>
                <Th>School Env</Th>
                <Th>Social Attitude</Th>
              </Tr>
            </Thead>
            <Tbody>
              {allocation_summary.map((row) => (
                <Tr key={row.class_id}>
                  <Td>{row.class_label}</Td>
                  <Td>{row.student_count}</Td>
                  <Td isNumeric>
                    {row.alloc_academic_engagement_score.toFixed(3)} / {row.target_academic_engagement_score.toFixed(3)}
                  </Td>
                  <Td isNumeric>
                    {row.alloc_academic_wellbeing_score.toFixed(3)} / {row.target_academic_wellbeing_score.toFixed(3)}
                  </Td>
                  <Td isNumeric>
                    {row.alloc_gender_norm_score.toFixed(3)} / {row.target_gender_norm_score.toFixed(3)}
                  </Td>
                  <Td isNumeric>
                    {row.alloc_growth_mindset_score.toFixed(3)} / {row.target_growth_mindset_score.toFixed(3)}
                  </Td>
                  <Td isNumeric>
                    {row.alloc_mental_health_score.toFixed(3)} / {row.target_mental_health_score.toFixed(3)}
                  </Td>
                  <Td isNumeric>
                    {row.alloc_school_environment_score.toFixed(3)} / {row.target_school_environment_score.toFixed(3)}
                  </Td>
                  <Td isNumeric>
                    {row.alloc_social_attitude_score.toFixed(3)} / {row.target_social_attitude_score.toFixed(3)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          
          {/* Delta Table */}
          <Heading size="md" mt={8} mb={2}>Score Deviations (%)</Heading>
          <Table variant="striped" size="sm" overflowX="auto">
            <Thead>
              <Tr>
                <Th>Class</Th>
                <Th isNumeric>Engagement</Th>
                <Th isNumeric>Wellbeing</Th>
                <Th isNumeric>Gender Norm</Th>
                <Th isNumeric>Growth Mindset</Th>
                <Th isNumeric>Mental Health</Th>
                <Th isNumeric>School Env</Th>
                <Th isNumeric>Social Attitude</Th>
                <Th isNumeric>Mean Deviation</Th>
              </Tr>
            </Thead>
            <Tbody>
              {allocation_summary.map((row) => {
                const dEng = Math.abs(row.alloc_academic_engagement_score - row.target_academic_engagement_score);
                const dWell = Math.abs(row.alloc_academic_wellbeing_score - row.target_academic_wellbeing_score);
                const dGender = Math.abs(row.alloc_gender_norm_score - row.target_gender_norm_score);
                const dGrowth = Math.abs(row.alloc_growth_mindset_score - row.target_growth_mindset_score);
                const dMental = Math.abs(row.alloc_mental_health_score - row.target_mental_health_score);
                const dSchool = Math.abs(row.alloc_school_environment_score - row.target_school_environment_score);
                const dSocial = Math.abs(row.alloc_social_attitude_score - row.target_social_attitude_score);
                const pEng = row.target_academic_engagement_score ? (dEng / row.target_academic_engagement_score) * 100 : 0;
                const pWell = row.target_academic_wellbeing_score ? (dWell / row.target_academic_wellbeing_score) * 100 : 0;
                const pGender = row.target_gender_norm_score ? (dGender / row.target_gender_norm_score) * 100 : 0;
                const pGrowth = row.target_growth_mindset_score ? (dGrowth / row.target_growth_mindset_score) * 100 : 0;
                const pMental = row.target_mental_health_score ? (dMental / row.target_mental_health_score) * 100 : 0;
                const pSchool = row.target_school_environment_score ? (dSchool / row.target_school_environment_score) * 100 : 0;
                const pSocial = row.target_social_attitude_score ? (dSocial / row.target_social_attitude_score) * 100 : 0;
                const meanPct = (pEng + pWell + pGender + pGrowth + pMental + pSchool + pSocial) / 7;
                return (
                  <Tr key={row.class_id}>
                    <Td>{row.class_label}</Td>
                    <Td isNumeric>{pEng.toFixed(1)}%</Td>
                    <Td isNumeric>{pWell.toFixed(1)}%</Td>
                    <Td isNumeric>{pGender.toFixed(1)}%</Td>
                    <Td isNumeric>{pGrowth.toFixed(1)}%</Td>
                    <Td isNumeric>{pMental.toFixed(1)}%</Td>
                    <Td isNumeric>{pSchool.toFixed(1)}%</Td>
                    <Td isNumeric>{pSocial.toFixed(1)}%</Td>
                    <Td isNumeric fontWeight="bold">{meanPct.toFixed(1)}%</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>

          {/* Link Counts Table */}
          <Heading size="md" mt={8} mb={2}>Link Counts</Heading>
          <Table variant="striped" size="sm" overflowX="auto">
            <Thead>
              <Tr>
                <Th>Class</Th>
                <Th isNumeric>Friendships</Th>
                <Th isNumeric>Influence</Th>
                <Th isNumeric>Feedback</Th>
                <Th isNumeric>More Time</Th>
                <Th isNumeric>Advice</Th>
                <Th isNumeric>Disrespect</Th>
              </Tr>
            </Thead>
            <Tbody>
              {allocation_summary.map((row) => (
                <Tr key={row.class_id}>
                  <Td>{row.class_label}</Td>
                  <Td isNumeric>{row.num_friendships}</Td>
                  <Td isNumeric>{row.num_influence}</Td>
                  <Td isNumeric>{row.num_feedback}</Td>
                  <Td isNumeric>{row.num_more_time}</Td>
                  <Td isNumeric>{row.num_advice}</Td>
                  <Td isNumeric>{row.num_disrespect}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default AllocationResults;
