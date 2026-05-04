import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { NotificationProvider } from '../NotificationContext';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <NotificationProvider>
      <div className="layout-container">
        <Sidebar />
        <div className="main-content">
          <Header />
          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default MainLayout;
