import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Clock, Calendar as CalendarIcon } from 'lucide-react';
import API_BASE_URL from '../config/api';
import './Dashboard.css';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="stat-card card">
    <div className={`stat-icon ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div className="stat-info">
      <h3>{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, activeClasses: 0, todaysLectures: 0 });
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      }
    };
    if (userInfo.role === 'admin' || userInfo.role === 'hod') {
      fetchStats();
    }
  }, [userInfo.token, userInfo.role]);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome back, {userInfo.name} 👋</h1>
          <p className="text-secondary">Here's what's happening today.</p>
        </div>
        {(userInfo.role === 'admin' || userInfo.role === 'hod') && (
          <button className="btn-primary" onClick={() => navigate('/timetable')}>
            + Create Timetable
          </button>
        )}
      </div>

      <div className="stats-grid">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} colorClass="bg-blue" />
        <StatCard title="Total Teachers" value={stats.totalTeachers} icon={BookOpen} colorClass="bg-green" />
        <StatCard title="Active Classes" value={stats.activeClasses} icon={CalendarIcon} colorClass="bg-purple" />
        
        {userInfo.role === 'hod' ? (
          <StatCard title="Pending Swaps" value={stats.pendingSwaps || 0} icon={Clock} colorClass="bg-orange" />
        ) : (
          <StatCard title="Today's Lectures" value={stats.todaysLectures} icon={Clock} colorClass="bg-orange" />
        )}
      </div>

      <div className="dashboard-content">
        <div className="card recent-activity">
          <h2>Recent Timetable Updates</h2>
          <div className="activity-list">
            {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>No recent activity.</p>
            ) : stats.recentActivity.map(activity => (
              <div className="activity-item" key={activity.id}>
                <div className={`activity-dot ${activity.type === 'swap' ? 'orange' : 'blue'}`}></div>
                <div className="activity-details">
                  <p dangerouslySetInnerHTML={{ __html: activity.message }}></p>
                  <span className="time">{new Date(activity.time).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card upcoming-classes">
          <h2>Today's Upcoming Classes</h2>
          <div className="class-list">
            {(!stats.upcomingClasses || stats.upcomingClasses.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>No more classes scheduled for today.</p>
            ) : stats.upcomingClasses.map(cls => (
              <div className="class-item" key={cls._id}>
                <div className="class-time">{cls.startTime}</div>
                <div className="class-info">
                  <h4>{cls.subject?.name}</h4>
                  <p>{cls.class?.name} • Room {cls.room || 'TBA'}</p>
                </div>
                <div className="class-prof">{cls.teacher?.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
