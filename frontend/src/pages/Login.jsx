import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Assuming backend is running on 5001
      const { data } = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      // Redirect based on role
      if (data.role === 'admin') navigate('/admin-dashboard');
      else if (data.role === 'hod') navigate('/hod-dashboard');
      else if (data.role === 'teacher') navigate('/teacher-dashboard');
      else if (data.role === 'student') navigate('/student-dashboard');
      else navigate('/dashboard');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-logo">
          <div className="logo-icon">
            <Calendar size={28} color="#fff" />
          </div>
          <h1>EduSchedule</h1>
        </div>
        <div className="login-content">
          <h2>Sign in to your account</h2>
          <p className="login-subtitle">Manage timetables, attendance, and classes all in one place.</p>
          
          {error && <div className="error-message" style={{color: 'red', marginBottom: '1rem'}}>{error}</div>}
          
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="admin@college.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            
            <button type="submit" className="btn-primary login-btn">
              Sign In
            </button>
          </form>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-illustration">
          <h3>Intelligent Timetable Generation</h3>
          <p>Automatically create conflict-free schedules for your entire institution in minutes.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
