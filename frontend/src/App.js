// src/App.js
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from './components/PrivateRoute';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AllocationResults from './pages/AllocationResults';
import SnaSurvey from './pages/SnaSurvey';
import ClassVisualizations from './pages/ClassVisualizations';
import StudentVisualization from './pages/StudentVisualizations';
import Login from './pages/login'; // capital "L" for consistency with file
import AllocationSettings from './pages/AllocationSettings';
import ManualOverride from './pages/ManualOverride'; 
import StudentFeedback from './pages/StudentFeedback';
import TeacherFeedbackPage from './pages/TeacherFeedbackPage'; 

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/allocation-results" element={<AllocationResults />} />
            <Route path="/allocation-settings" element={<AllocationSettings />} />
            <Route path="/class-visualizations" element={<ClassVisualizations />} />
            <Route path="/student-visualizations" element={<StudentVisualization />} />
            <Route path="/survey" element={<SnaSurvey />} />
            <Route path="/manual-override" element={<ManualOverride />} />
            <Route path="/feedback" element={<StudentFeedback />} />
            <Route path="/teacher-feedback" element={<TeacherFeedbackPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
