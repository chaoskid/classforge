// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { Box, Flex, Heading, Button, HStack } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from '../pages/axiosConfig';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // On mount, check if there's a logged-in user
  useEffect(() => {
    axios
      .get('/api/current_user', { withCredentials: true })
      .then(res => {
        setUser({
          id: res.data.user_id,
          type: res.data.user_type,
        });
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true });
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  // Decide dashboard path based on user type
  const dashPath =
    user?.type === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';

  return (
    <Box bg="blue.900" color="white" px={6} py={4} shadow="md">
      <Flex align="center" justify="space-between">
        <Heading size="md">ClassForge</Heading>

        {user && (
          <HStack spacing={4}>
            <Button
              as={RouterLink}
              to={dashPath}
              variant="ghost"
              color="white"
              _hover={{ bg: 'blue.700' }}
            >
              Dashboard
            </Button>

            <Button
              variant="ghost"
              color="white"
              _hover={{ bg: 'blue.700' }}
              onClick={handleLogout}
            >
              Log out
            </Button>
          </HStack>
        )}
      </Flex>
    </Box>
  );
};

export default Navbar;
