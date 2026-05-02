import React, { useState, useEffect } from 'react';
import { Bell, Search, User } from 'lucide-react';
import axios from 'axios';
import './Header.css';

const Header = () => {
  const [notifications, setNotifications] = useState(0);
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || { name: 'Guest', role: 'User' };

  useEffect(() => {
    // Only fetch if token exists
    if (userInfo && userInfo.token) {
      const fetchNotifications = async () => {
        try {
          // Fetch swap requests to show as notifications for HOD
          if (userInfo.role === 'hod') {
            const { data } = await axios.get('http://localhost:5001/api/swaps', {
              headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            const pending = data.filter(req => req.status === 'pending');
            setNotifications(pending.length);
          } else {
            // Placeholder for other roles
            setNotifications(0);
          }
        } catch (error) {
          console.error('Error fetching notifications', error);
        }
      };
      fetchNotifications();
    }
  }, []);

  return (
    <header className="header">
      <div className="header-search">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Search classes, teachers, subjects..." />
      </div>
      
      <div className="header-actions">
        <button className="icon-btn notification-btn">
          <Bell size={20} />
          {notifications > 0 && <span className="badge">{notifications}</span>}
        </button>
        
        <div className="user-profile">
          <div className="avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">{userInfo.name}</span>
            <span className="user-role" style={{ textTransform: 'capitalize' }}>
              {userInfo.role === 'hod' ? 'HOD' : userInfo.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
