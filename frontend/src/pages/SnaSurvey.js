// src/pages/SnaSurvey.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  useToast,
  Progress,
  Text,
  Spinner,
  Center
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Step1_AboutYou from '../components/SurveySteps/Step1_AboutYou';
import Step2_AboutSchool from '../components/SurveySteps/Step2_AboutSchool';
import Step3_YourWellbeing from '../components/SurveySteps/Step3_YourWellbeing';
import Step4_YourGrowth from '../components/SurveySteps/Step4_YourGrowth';
import Step5_GenderNorms from '../components/SurveySteps/Step5_GenderNorms';
import Step6_YourNetwork from '../components/SurveySteps/Step6_YourNetwork';
import Step7_ReviewSubmit from '../components/SurveySteps/Step7_ReviewSubmit';
import axios from '../pages/axiosConfig';

const TOTAL_STEPS = 7;

const SnaSurvey = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  // On mount: verify session and retrieve user_id
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axios.get('/api/current_user', { withCredentials: true });
        const uid = res.data.user_id;
        if (!uid) {
          // Not logged in → redirect to login
          navigate('/login', { replace: true });
        } else {
          setFormData({ student_id: uid });
        }
      } catch (err) {
        console.error('Session check failed:', err);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [navigate]);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    try {
      console.log('Submitting form data:', formData);
      await axios.post('/api/survey', formData, { withCredentials: true });
      toast({ title: 'Survey submitted!', status: 'success', duration: 3000 });
      // Wait a bit for the toast to be visible, then redirect
      setTimeout(() => {
        navigate('/student-dashboard');  // 🔁 Redirect to dashboard
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission failed.',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1_AboutYou data={formData} updateFormData={updateFormData} onNext={handleNext} />;
      case 2:
        return <Step2_AboutSchool data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <Step3_YourWellbeing data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <Step4_YourGrowth data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <Step5_GenderNorms data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <Step6_YourNetwork data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 7:
        return <Step7_ReviewSubmit data={formData} onSubmit={handleSubmit} onBack={handleBack} />;
      default:
        return <Heading size="md">Unknown step</Heading>;
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" label="Verifying session…" />
      </Center>
    );
  }

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="2xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={2} textAlign="center">
            School Social Networks and Wellbeing Survey
          </Heading>
          <Text mb={2} textAlign="center" color="gray.600">
            Step {step} of {TOTAL_STEPS}
          </Text>
          <Progress value={(step / TOTAL_STEPS) * 100} mb={6} colorScheme="teal" borderRadius="md" />
          {renderStep()}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default SnaSurvey;