import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Admin from './pages/Admin';
import PrivateRoute from './components/PrivateRoute';
import Activate from './pages/Activate';
import PasswordReset from './components/admin/PasswordReset';
import UserManagement from './components/admin/UserManagement';
import PrizeManagement from './components/admin/PrizeManagement';
import DrawRecordManagement from './components/admin/DrawRecordManagement';

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
        >
          <Route path="" element={<Navigate to="password" />} />
          <Route path="password" element={<PasswordReset />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="prizes" element={<PrizeManagement />} />
          <Route path="records" element={<DrawRecordManagement />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/activate" element={<Activate />} />
        <Route path="/" element={<Navigate to="/activate" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 