// src/pages/Allocations.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
} from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const Allocations = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <Box bg="gray.100" minH="100vh" py={10}>
        <Container maxW="7xl" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Heading size="lg" mb={4}>Allocations</Heading>
          <Text mb={6}>This page is under development. Please check back soon!</Text>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default Allocations;
