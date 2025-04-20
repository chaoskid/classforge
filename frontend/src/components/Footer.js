import { Box, Text } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box as="footer" py={4} bg="gray.100" textAlign="center" mt={10}>
      <Text fontSize="sm" color="gray.600">
        © {new Date().getFullYear()} ClassForge. All rights reserved.
      </Text>
    </Box>
  );
};

export default Footer;
