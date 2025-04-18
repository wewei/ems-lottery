import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Admin from './pages/Admin';
import PrivateRoute from './components/PrivateRoute';
import Activate from './pages/Activate';
import UserManagement from './components/admin/UserManagement';
import PrizeManagement from './components/admin/PrizeManagement';
import DrawRecordManagement from './components/admin/DrawRecordManagement';
import Lottery from './pages/Lottery';
import LotteryDraw from './pages/LotteryDraw';
import AdvancedSettings from './components/admin/AdvancedSettings';

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
          <Route path="" element={<Navigate to="prizes" />} />
          <Route path="prizes" element={<PrizeManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="records" element={<DrawRecordManagement />} />
          <Route path="settings" element={<AdvancedSettings />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/activate" element={<Activate />} />
        <Route path="/" element={<Navigate to="/activate" />} />
        <Route path="/lottery" element={<Lottery />} />
        <Route path="/lottery/:prizeId" element={<LotteryDraw />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 