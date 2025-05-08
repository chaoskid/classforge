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
  SimpleGrid } from '@chakra-ui/react';
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


  useEffect(() => {
    axios.get('/api/student-survey-responses', { withCredentials: true })
      .then(res => {
        if (res.status === 200) {
          setResponses(res.data);
        }
      }).catch(err => console.error(err));
      
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
      .catch(err => console.error(err));
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
          <Button variant="outline" onClick={() => navigate('/survey')}>
          Retake Survey
          </Button>
          <Button variant="Outline" onClick={() => alert("Feedback system coming soon!")} mr={4}>
          Give Feedback
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
          {Object.keys(responses).length > 0 && (
  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={10}>
    
  <Box p={4} border="1px solid #ccc" borderRadius="lg" bg="gray.50">
    {/* Student Info */}
    <Heading size="md" mb={4}>Student Info</Heading>
    <Text><b>Name:</b> {studentDetails?.student?.name}</Text>
    <Text><b>Email:</b> {studentDetails?.student?.email}</Text>
    <Text><b>Subjects:</b> {studentDetails?.units?.join(', ') || 'None'}</Text>
    <Text><b>Clubs:</b> {studentDetails?.clubs?.join(', ') || 'None'}</Text>

    {studentDetails?.student?.class_id !== undefined && studentDetails.student.class_id !== null && (
      <Text><b>Allocated Class:</b> Class {studentDetails.student.class_id}</Text>
    )}

    {/* Friendship Retention */}
    <Heading size="md" mt={8} mb={4}>Friendship Retention</Heading>
    <Box w="200px" mx="auto"  transform="rotate(-90deg)" overflow="hidden">
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

    {/* Wellbeing Radar Chart */}
    {studentDetails?.student?.scores && (
      <Box >
        <Heading size="md" mb={4}>Personal Wellbeing Profile</Heading>
        <Box w="100%" maxW="500px" mx="auto" h="400px">
          <StudentRadarChart scores={studentDetails.student.scores} />
        </Box>
      </Box>
    )}
  </Box>


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
