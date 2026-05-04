import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, X, Clock } from 'lucide-react';
import { useNotificationContext } from '../NotificationContext';
import './Header.css';

const Header = () => {
  const [showPanel, setShowPanel]   = useState(false);
  const panelRef                    = useRef(null);
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || { name: 'Guest', role: 'user' };

  const { notifications, unread, markAllRead, toasts, dismissToast } =
    useNotificationContext();

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    setShowPanel(prev => !prev);
    if (!showPanel) markAllRead();
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* ── Stacked Toasts ─────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast, idx) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'all',
              background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
              color: 'white',
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              minWidth: 300,
              maxWidth: 380,
              animation: 'slideInRight 0.35s ease-out',
              transform: `translateY(${idx * 2}px)`,
            }}
          >
            <span style={{ fontSize: '1.4rem', marginTop: '-2px' }}>🔔</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>{toast.title}</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', opacity: 0.9 }}>{toast.body}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Header Bar ─────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-search">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search classes, teachers, subjects..." />
        </div>

        <div className="header-actions">
          {/* Notification Bell */}
          <div style={{ position: 'relative' }} ref={panelRef}>
            <button
              className="icon-btn notification-btn"
              onClick={handleBellClick}
              style={{ animation: unread > 0 ? 'bellRing 0.6s ease' : 'none' }}
              title="Notifications"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="badge" style={{ animation: 'pop 0.3s ease-out' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* Dropdown Panel */}
            {showPanel && (
              <div style={{
                position: 'absolute', top: '48px', right: 0,
                width: 360, maxHeight: 440,
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slideDown 0.2s ease-out',
              }}>
                {/* Panel header */}
                <div style={{
                  padding: '1rem 1.25rem 0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Notifications</h3>
                    {notifications.length > 0 && (
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {notifications.length} total this session
                      </p>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{ fontSize: '0.75rem', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                      <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🔕</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                        {userInfo.role === 'teacher'
                          ? 'You\'ll be notified 10 minutes before each class.'
                          : 'No notifications yet.'}
                      </p>
                    </div>
                  ) : notifications.map((n) => (
                    <div
                      key={n.id + n.time}
                      style={{
                        padding: '0.85rem 1.25rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                        background: n.read ? 'transparent' : 'rgba(79,70,229,0.04)',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '1rem',
                      }}>
                        🔔
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{n.title}</p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{n.body}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                          <Clock size={11} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{formatTime(n.time)}</span>
                        </div>
                      </div>
                      {!n.read && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0, marginTop: 6 }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                {userInfo.role === 'teacher' && (
                  <div style={{
                    padding: '0.6rem 1.25rem',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    <Clock size={11} />
                    Reminders fire 10 minutes before each class
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User profile */}
          <div className="user-profile">
            <div className="avatar"><User size={20} /></div>
            <div className="user-info">
              <span className="user-name">{userInfo.name}</span>
              <span className="user-role" style={{ textTransform: 'capitalize' }}>
                {userInfo.role === 'hod' ? 'HOD' : userInfo.role}
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
