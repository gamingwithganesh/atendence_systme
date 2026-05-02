import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SwapRequests = () => {
  const [requests, setRequests] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/swaps', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setRequests(data);
    } catch (error) {
      console.error('Error fetching swap requests', error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id, action) => {
    try {
      await axios.put(`http://localhost:5001/api/swaps/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || `Error ${action}ing swap`);
    }
  };

  const formatSlot = (slot) => {
    if (!slot) return 'N/A';
    return `${slot.dayOfWeek} ${slot.startTime}`;
  };

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Swap Requests Hub</h1>
          <p className="text-secondary">Approve or reject timetable swap requests from teachers.</p>
        </div>
      </div>

      <div className="card">
        <table className="timetable-grid" style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              <th>Requesting Teacher</th>
              <th>Target Teacher</th>
              <th>Slots to Swap</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No swap requests found.</td></tr>
            ) : requests.map(req => (
              <tr key={req._id} style={{ textAlign: 'center' }}>
                <td style={{ padding: '1rem' }}>{req.requestingTeacher?.name}</td>
                <td>{req.targetTeacher?.name}</td>
                <td>{formatSlot(req.requestingSlot)} ↔ {formatSlot(req.targetSlot)}</td>
                <td>
                  <span className={`class-prof`} style={{ 
                    backgroundColor: req.status === 'pending' ? '#FEF3C7' : req.status === 'approved' ? '#D1FAE5' : '#FEE2E2',
                    color: req.status === 'pending' ? '#D97706' : req.status === 'approved' ? '#059669' : '#DC2626',
                    borderColor: 'transparent'
                  }}>
                    {req.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn-primary" onClick={() => handleStatusChange(req._id, 'approve')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#10B981' }}>Approve</button>
                      <button className="btn-primary" onClick={() => handleStatusChange(req._id, 'reject')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#EF4444' }}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SwapRequests;
