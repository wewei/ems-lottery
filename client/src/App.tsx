import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Admin from './pages/Admin';
import PrivateRoute from './components/PrivateRoute';
import Activate from './pages/Activate';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/activate" element={<Activate />} />
        <Route 
          path="/" 
          element={
            localStorage.getItem('token') ? 
              <Navigate to="/admin" /> : 
              <Navigate to="/activate" />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 