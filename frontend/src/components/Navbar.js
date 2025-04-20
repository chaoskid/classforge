import { Box, Flex, Heading } from '@chakra-ui/react';

const Navbar = () => {
  return (
    <Box bg="blue.900" color="white" px={6} py={4} shadow="md">
      <Flex align="center" justify="space-between">
        <Heading size="md">ClassForge</Heading>
      </Flex>
    </Box>
  );
};

export default Navbar;
