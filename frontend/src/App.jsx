import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Login from './pages/Login';

import ManageHODs from './pages/Admin/ManageHODs';
import SwapRequests from './pages/HOD/SwapRequests';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import ManageTeachers from './pages/HOD/ManageTeachers';
import ManageSubjects from './pages/HOD/ManageSubjects';
import ManageStudents from './pages/HOD/ManageStudents';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes Wrapper */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Admin Routes */}
          <Route path="admin-dashboard" element={<Dashboard />} />
          <Route path="manage-hods" element={<ManageHODs />} />
          
          {/* HOD Routes */}
          <Route path="hod-dashboard" element={<Dashboard />} />
          <Route path="manage-teachers" element={<ManageTeachers />} />
          <Route path="manage-subjects" element={<ManageSubjects />} />
          <Route path="manage-students" element={<ManageStudents />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="swap-requests" element={<SwapRequests />} />
          
          {/* Teacher Routes */}
          <Route path="teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="my-timetable" element={<Timetable />} />
          
          {/* Student Routes */}
          <Route path="student-dashboard" element={<Timetable />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
