// PushReallocation.jsx
import React, { useState } from 'react'
import {
  Box,
  Heading,
  Input,
  Button,
  FormControl,
  FormLabel,
  useToast,
    Container,
    HStack
} from '@chakra-ui/react'
import axios from '../pages/axiosConfig'

export default function Admin() {
  const [count, setCount] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleClick = async () => {
    const n = parseInt(count, 10)
    if (isNaN(n) || n <= 0) {
      toast({
        status: 'error',
        title: 'Invalid number',
        description: 'Please enter a positive integer.',
      })
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/push-reallocations', { count: n })
      toast({
        status: 'success',
        title: 'Reallocations pushed',
        description: `Updated ${res.data.updated.length} records.`,
      })
      console.log('Updated rows:', res.data.updated)
    } catch (err) {
      toast({
        status: 'error',
        title: 'Error pushing reallocations',
        description: err.response?.data?.error || err.message,
        duration: 6000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
        <Box bg="gray.100" minH="100vh" py={10} pt={10}>
          <Container maxW="7xl" minH="90vh" bg="white" borderRadius="lg" boxShadow="lg" p={10}>
      <Heading size="lg" mb={6}>Test Panel</Heading>

      <Heading size="m" mb={15}>Add Reallocations</Heading>
      <HStack spacing={4} align="flex-end">
  <FormControl flex="1">
    <FormLabel>Number of students to reallocate</FormLabel>
    <Input
      type="number"
      value={count}
      onChange={e => setCount(e.target.value)}
      placeholder="e.g. 5"
    />
  </FormControl>

  <Button
    colorScheme="blue"
    onClick={handleClick}
    isLoading={loading}
    loadingText="Pushing..."
    minW="120px"
  >
    Push Reallocation
  </Button>
</HStack>
      </Container>
    </Box>
  )
}
