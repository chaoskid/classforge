// src/pages/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Box,
  Container,
  Heading,
  Text,
  Button,
  Table,
  Tbody,
  Tr,
  Td,
  SimpleGrid,
  Spinner
 } from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from '../pages/axiosConfig';
import { useNavigate } from 'react-router-dom';
import StudentNetworkGraph from '../components/StudentNetworkGraph';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import StudentRadarChart from '../components/StudentRadarChart';
import AcademicScoreChart from '../components/AcademicScoreChart';
import ClubParticipationDonut from '../components/ClubParticipationDonut';



const StudentDashboard = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState({});
  const [studentDetails, setStudentDetails] = useState({});
  const [retention, setRetention] = useState(0);
  const [allClubs, setAllClubs] = useState([]);
  const [popularClubs, setPopularClubs] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    axios.get('/api/student-survey-responses', { withCredentials: true })
      .then(res => {
        if (res.status === 200) {
          setResponses(res.data);
        }
      }).catch(err => console.error(err));
      
      setLoading(true);
      axios.get('/api/student-info', { withCredentials: true })
    .then(res => {
      if (res.status === 200) {
        setStudentDetails(res.data);
      }
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    axios.get('/api/clubs', { withCredentials: true })
      .then(res => {
        const all = res.data || [];
        setAllClubs(all);
  
        // Frequency map to count club popularity
        const clubCount = {};
        all.forEach(club => {
          clubCount[club.club_name] = (clubCount[club.club_name] || 0) + 1;
        });
  
        // Sort by frequency and get top 5
        const sorted = Object.entries(clubCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(entry => entry[0]);
  
        setPopularClubs(sorted);
      })
      .catch(err => console.error(err))
      .finally(() => {
        setLoading(false);
      });
  }, []);
  
  
  
  const handleLogout = async () => {
    await axios.post('/api/logout', {}, { withCredentials: true });
    navigate('/login');
  };
  useEffect(() => {
    if (
      studentDetails.relationships &&
      studentDetails.classmates &&
      studentDetails.student
    ) {
      const myId = studentDetails.student.student_id;
      const myClassmates = studentDetails.classmates;
    
      const positiveLinks = studentDetails.relationships.filter(
        (rel) =>
          rel.source === myId &&  // optional: filter by source to be sure
          ["friends", "advice", "influence"].includes(rel.link_type)
      );
      const retainedLinks = positiveLinks.filter((rel) =>
        myClassmates.includes(rel.target)
      );
  
      const retentionPercent =
        positiveLinks.length > 0
          ? retainedLinks.length / positiveLinks.length
          : 0;
  
      setRetention(retentionPercent);
    }
  }, [studentDetails]);
  
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
  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={4}>Student Dashboard</Heading>
          <Text mb={6}>Hi {studentDetails?.student?.name?.split(" ")[0]}, welcome to ClassForge!</Text>
          <Button colorScheme="teal" onClick={() => navigate('/survey')} mr={4}>
            Go to Survey
          </Button>
          <Button variant="outline" onClick={() => navigate('/survey')} mr={4}>
          Retake Survey
          </Button>
          <Button variant="outline" onClick={() => navigate('/feedback')} mr={4}>
             Give Feedback
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
          {Object.keys(responses).length > 0 && (
  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={10} alignItems="stretch">
      
{/* 📋 Left Column */}
<Box mb={6} p={4} border="1px solid #ccc" borderRadius="lg" bg="gray.50">
  {/* 👤 Student Info */}
  <Box mb={4} >
    <Heading size="md" mb={2}>Student Information</Heading>
    <Text><strong>Name:</strong> {studentDetails?.student?.name}</Text>
    <Text><strong>Email:</strong> {studentDetails?.student?.email}</Text>
    <Text><strong>Class:</strong> {studentDetails?.student?.class_id || 'N/A'}</Text>
    <Text><strong>Clubs:</strong> {(studentDetails?.clubs || []).join(', ') || 'None'}</Text>
  </Box>

  {/* 🧭 Friendship Retention */}
  <Heading size="md" mb={4}>Friendship Retention</Heading>
  <Box w="200px" mx="auto" mt={4} transform="rotate(-90deg)">
    <CircularProgressbarWithChildren
      value={retention * 100}
      maxValue={100}
      strokeWidth={10}
      styles={buildStyles({
        pathColor: '#0a2f5c',
        trailColor: '#f4e3c1',
        strokeLinecap: 'butt',
        rotation: 1,
      })}
      circleRatio={0.5}
    >
      <div style={{ transform: 'rotate(90deg)' }}>
        <Text fontSize="2xl" fontWeight="bold">{Math.round(retention * 100)}%</Text>
      </div>
    </CircularProgressbarWithChildren>
  </Box>

  {/* 🌱 Wellbeing Radar */}
  {studentDetails?.student?.scores && (
    <>
      <Heading size="md" mt={10} mb={4}>Personal Wellbeing Profile</Heading>
      <Box w="100%" maxW="500px" mx="auto" h="400px">
        <StudentRadarChart scores={studentDetails.student.scores} />
      </Box>
    </>
  )}
</Box>


{/* 📊 Right Column */}
<Box p={4} border="1px solid #ccc" borderRadius="lg" bg="gray.50">
  {studentDetails?.relationships?.length > 0 && (
    <Box mt={6}>
      <Heading size="md" mb={4}>Relationship Network</Heading>
      <StudentNetworkGraph
        name={studentDetails.student?.name || "You"}
        relationships={studentDetails.relationships}
      />
    </Box>
  )}
  {studentDetails?.student?.academic_score && (
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
)}

        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default StudentDashboard;
