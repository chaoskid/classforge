// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../pages/axiosConfig';
import {
  Box, Button, Container, Heading, Input, FormControl, FormLabel,
  useToast, Alert, AlertIcon
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginerror, setLoginerror] = useState('');

  const from = location.state?.from || '/';

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('/api/login', { email, password }, { withCredentials: true });

      if (response.status === 200) {
        const userType = response.data.user_type;
        if (userType === 'student') navigate('/student-dashboard');
        else if (userType === 'teacher') navigate('/teacher-dashboard');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setLoginerror(error.response.data.message);
      } else {
        setLoginerror('Unexpected error occurred. Please contact the administrator.');
      }
    }
  };

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="md" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={6} textAlign="center">
            ClassForge Login
          </Heading>

          {location.state?.showLoginMessage && (
            <Alert status="info" mb={4} borderRadius="md">
              <AlertIcon />
              Please login to continue.
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FormControl isRequired mb={4}>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>

            <FormControl isRequired mb={6}>
              <FormLabel>Password</FormLabel>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </FormControl>

            {loginerror && (
              <Alert status="error" mb={4} borderRadius="md">
                <AlertIcon />
                {loginerror}
              </Alert>
            )}

            <Button type="submit" colorScheme="teal" width="full" size="md">
              Login
            </Button>
          </form>
        </Container>
      </Box>
      <Footer />
    </>
  );
}

export default Login;
