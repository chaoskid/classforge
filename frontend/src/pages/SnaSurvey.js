// src/pages/SnaSurvey.js
import React, { useState } from 'react';
import {
  Box, Container, Heading, useToast, Progress, Text
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Step1_AboutYou from '../components/SurveySteps/Step1_AboutYou';
import Step2_AboutSchool from '../components/SurveySteps/Step2_AboutSchool';
import Step3_YourOpinions from '../components/SurveySteps/Step3_YourOpinions';
import Step4_YourNetwork from '../components/SurveySteps/Step4_YourNetwork';
import Step5_ReviewSubmit from '../components/SurveySteps/Step5_ReviewSubmit';
import axios from 'axios';

const TOTAL_STEPS = 5;

const SnaSurvey = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const toast = useToast();

  const updateFormData = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      console.log('Submitting form data:', formData); // optional debug log
      await axios.post('http://localhost:5000/api/survey', formData);
      toast({ title: 'Survey submitted!', status: 'success', duration: 3000 });
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
        return <Step3_YourOpinions data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <Step4_YourNetwork data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <Step5_ReviewSubmit data={formData} onSubmit={handleSubmit} onBack={handleBack} />;
      default:
        return <Heading size="md">Unknown step</Heading>;
    }
  };

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
