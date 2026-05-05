import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import '../Dashboard.css';

const SwapRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/swaps`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setRequests(data);
    } catch (err) {
      console.error('Error fetching swap requests', err);
      setError(err.response?.data?.message || 'Failed to load swap history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatSlot = (slot) => {
    if (!slot) return null;
    return `${slot.dayOfWeek} ${slot.startTime}${slot.subject?.name ? ' — ' + slot.subject.name : ''}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Handle old records that may not have targetTeacherStatus
  const getTeacherDecision = (req) => {
    const ts = req.targetTeacherStatus;
    if (ts === 'accepted') return { label: 'Accepted', color: '#059669', bg: '#D1FAE5' };
    if (ts === 'declined') return { label: 'Declined', color: '#DC2626', bg: '#FEE2E2' };
    // Old records with no targetTeacherStatus — infer from final status
    if (!ts || ts === 'pending') {
      if (req.status === 'approved') return { label: 'Accepted', color: '#059669', bg: '#D1FAE5' };
      if (req.status === 'rejected') return { label: 'Declined', color: '#DC2626', bg: '#FEE2E2' };
      return { label: 'Awaiting', color: '#D97706', bg: '#FEF3C7' };
    }
    return { label: 'Awaiting', color: '#D97706', bg: '#FEF3C7' };
  };

  const getStatusStyle = (status) => ({
    backgroundColor: status === 'pending' ? '#FEF3C7' : status === 'approved' ? '#D1FAE5' : '#FEE2E2',
    color: status === 'pending' ? '#D97706' : status === 'approved' ? '#059669' : '#DC2626',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.78rem',
    fontWeight: 600,
    display: 'inline-block',
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Swap Request History</h1>
          <p className="text-secondary">Complete audit trail of all swap requests between teachers.</p>
        </div>
        <button
          className="btn-secondary"
          onClick={fetchRequests}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
        >
          ↺ Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 1.1rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              fontWeight: 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              backgroundColor: filter === f ? 'var(--primary-color)' : 'var(--surface-color)',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
            <span style={{ opacity: 0.75 }}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 500 }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading swap history…
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No swap requests found for this filter.</p>
            </div>
          ) : (
            <table className="timetable-grid" style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date Requested</th>
                  <th>Requesting Teacher</th>
                  <th>Target Teacher</th>
                  <th>Their Slot</th>
                  <th>Swapping For</th>
                  <th>Teacher Decision</th>
                  <th>Final Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req, idx) => {
                  const decision = getTeacherDecision(req);
                  return (
                    <tr key={req._id}>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(req.createdAt)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {req.requestingTeacher?.name || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {req.targetTeacher?.name || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                        {formatSlot(req.requestingSlot) || (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Slot deleted</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                        {formatSlot(req.targetSlot) || (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Slot deleted</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: decision.bg,
                          color: decision.color,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'inline-block',
                        }}>
                          {decision.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={getStatusStyle(req.status)}>
                          {req.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {filtered.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', margin: 0 }}>
              Showing {filtered.length} of {requests.length} total requests
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SwapRequests;
