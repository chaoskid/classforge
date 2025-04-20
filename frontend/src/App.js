import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import SnaSurvey from './pages/SnaSurvey';

function App() {
  return (
    <ChakraProvider>
      <SnaSurvey />
    </ChakraProvider>
  );
}

export default App;
