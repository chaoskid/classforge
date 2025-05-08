import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Select,
  Button,
  SimpleGrid,
  Flex
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';
import StudentNetworkGraph from '../components/StudentNetworkGraph';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import StudentRadarChart from '../components/StudentRadarChart';
import AcademicScoreChart from '../components/AcademicScoreChart';
import ClubParticipationDonut from '../components/ClubParticipationDonut';
import { useNavigate } from 'react-router-dom';

export default function StudentVisualization() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentDetails, setStudentDetails] = useState({});
  const [retention, setRetention] = useState(0);
  const [allClubs, setAllClubs] = useState([]);
  const [popularClubs, setPopularClubs] = useState([]);
  const navigate = useNavigate();

  // Load list of students for dropdown
  useEffect(() => {
    axios.get('/api/students-and-classes')
      .then(res => {
        setStudents(res.data.students || []);
      })
      .catch(console.error);
  }, []);

  // Fetch student details and clubs when a student is selected
  useEffect(() => {
    if (!selectedStudent) return;

    // Student info (teacher endpoint)
    axios.get(`/api/student-info/${selectedStudent}`)
      .then(res => {
        setStudentDetails(res.data);
      })
      .catch(console.error);

    // All clubs for participation donut
    axios.get('/api/clubs')
      .then(res => {
        const all = res.data || [];
        setAllClubs(all);

        // Determine top 5 popular clubs
        const clubCount = {};
        all.forEach(c => {
          clubCount[c.club_name] = (clubCount[c.club_name] || 0) + 1;
        });
        const sorted = Object.entries(clubCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name]) => name);
        setPopularClubs(sorted);
      })
      .catch(console.error);
  }, [selectedStudent]);

  // Compute retention once studentDetails loads
  useEffect(() => {
    if (
      studentDetails.relationships &&
      studentDetails.classmates
    ) {
      const positiveLinks = studentDetails.relationships.filter(
        rel => ['friends', 'advice', 'influence'].includes(rel.link_type)
      );
      const retainedLinks = positiveLinks.filter(
        rel => studentDetails.classmates.includes(rel.target)
      );
      const pct = positiveLinks.length > 0 ? retainedLinks.length / positiveLinks.length : 0;
      setRetention(pct);
    }
  }, [studentDetails]);

  return (
    <>
      <Navbar id="navbar" tabIndex={-1} />
      <Box bg="gray.100" minH="100vh" py={10} pt={10}>
        <Container maxW="7xl" minH="90vh" bg="white" borderRadius="lg" boxShadow="lg" p={10}>
        <Button colorScheme="blue" onClick={() => navigate(-1)}>
                Back
              </Button>
        
      <Box minH="3vh"></Box>
          <Heading size="lg" mb={4}>Student Visualizations</Heading>

          <Box mb={6} w="300px">
            <Select
              placeholder="Select a student"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
            >
              {students.map(s => (
                <option key={s.student_id} value={s.student_id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Box>

          {!selectedStudent ? (
            <Text fontSize="lg" color="gray.500">
              Please select a student to view visualizations.
            </Text>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={4}>
                {/* Friendship Retention */}
                <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
                <Heading size="md" mb={4}>Student Info</Heading>
                  <Text><b>Name:</b> {studentDetails.student?.name}</Text>
                  <Text><b>Email:</b> {studentDetails.student?.email}</Text>
                  <Text><b>Subjects:</b> {studentDetails.units?.join(', ')}</Text>
                  <Text><b>Clubs:</b> {studentDetails.clubs?.join(', ')}</Text>
                  <Heading size="md" mb={4} mt={10}>Friendship Retention</Heading>
                <Box
                w="300px"
                h="200px"               // half of the width
                mx="auto"
                position="relative"
                >
                <CircularProgressbarWithChildren
                    value={retention * 100}
                    maxValue={100}
                    strokeWidth={10}
                    circleRatio={0.5}
                    styles={{
                    // remove built-in padding hack and fill the box vertically
                    root: { paddingBottom: 0, height: '100%' },
                    // draw the path (filled arc)
                    path: {
                        stroke: '#0a2f5c',
                        strokeLinecap: 'butt',
                        transformOrigin: 'center center',
                        transform: 'rotate(0.75turn)'
                    },
                    // draw the trail (background arc)
                    trail: {
                        stroke: '#f4e3c1',
                        strokeLinecap: 'butt',
                        transformOrigin: 'center center',
                        transform: 'rotate(0.75turn)'
                    }
                    }}
                >
                    <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    >
                    {Math.round(retention * 100)}%
                    </Text>
                </CircularProgressbarWithChildren>
                </Box>

                  {/* Wellbeing Radar*/}
                {studentDetails.student?.scores && (
                    <Box mt={10}>
                      <Heading size="md" mb={4}>Personal Wellbeing Profile</Heading>
                      <Flex justify="center">
                        <Box w="100%" maxW="500px" h="500px" mx="auto">
                            <StudentRadarChart scores={studentDetails.student.scores} />
                        </Box>
                      </Flex>
                    </Box>
                  )}
                </Box>

                {/* Student Info & Academic Score */}
                <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
                  {/* Relationship Network */}
                  {studentDetails.relationships?.length > 0 && (
                    <Box mt={6}>
                      <Heading size="md" mb={4}>Relationship Network</Heading>
                      <StudentNetworkGraph
                        name={studentDetails.student.name}
                        relationships={studentDetails.relationships}
                      />
                    </Box>
                  )}

                  {/* Academic Score Chart */}
                  {studentDetails.student?.academic_score != null && (
                    <Box mt={10}>
                      <Heading size="md" mb={4}>Academic Score vs Class Average</Heading>
                      <AcademicScoreChart
                        yourScore={studentDetails.student.academic_score}
                        classAvg={studentDetails.student.class_average_score}
                      />
                    </Box>
                  )}
                </Box>
              </SimpleGrid>
            </>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}
