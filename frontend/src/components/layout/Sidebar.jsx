import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, BookOpen, Clock, Settings, LogOut, FileText } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const role = userInfo.role || 'student';

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Calendar size={24} color="#fff" />
        </div>
        <h2>EduSchedule</h2>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-title">MAIN</div>
        
        {role === 'admin' && (
          <>
            <NavLink to="/admin-dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={20} />
              <span>Admin Dashboard</span>
            </NavLink>
            <NavLink to="/manage-hods" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={20} />
              <span>Manage HODs</span>
            </NavLink>
          </>
        )}

        {role === 'hod' && (
          <>
            <NavLink to="/hod-dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={20} />
              <span>HOD Dashboard</span>
            </NavLink>
            <NavLink to="/manage-teachers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={20} />
              <span>Manage Teachers</span>
            </NavLink>
            <NavLink to="/manage-students" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={20} />
              <span>Manage Students</span>
            </NavLink>
            <NavLink to="/manage-subjects" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <BookOpen size={20} />
              <span>Subjects & Classes</span>
            </NavLink>
            <NavLink to="/timetable" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Clock size={20} />
              <span>Timetables</span>
            </NavLink>
          </>
        )}

        {role === 'teacher' && (
          <>
            <NavLink to="/teacher-dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={20} />
              <span>Teacher Dashboard</span>
            </NavLink>
            <NavLink to="/my-timetable" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Clock size={20} />
              <span>My Timetable</span>
            </NavLink>
            <NavLink to="/swap-requests" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FileText size={20} />
              <span>Swap Requests</span>
            </NavLink>
          </>
        )}

        {role === 'student' && (
          <>
            <NavLink to="/student-dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Clock size={20} />
              <span>My Class Timetable</span>
            </NavLink>
          </>
        )}
        
        <div className="nav-spacer"></div>

        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Log out</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
