// src/components/PrivateRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from '../pages/axiosConfig';

const PrivateRoute = () => {
  const [auth, setAuth] = useState(null);
  const location = useLocation();

  useEffect(() => {
    axios.get('/api/current_user', { withCredentials: true })
      .then((res) => setAuth(res.data))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) return null; // or a spinner

  return auth ? <Outlet /> : <Navigate to="/login" state={{ from: location, showLoginMessage: true }} />;
};

export default PrivateRoute;
