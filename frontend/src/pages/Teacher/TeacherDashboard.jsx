import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const TeacherDashboard = () => {
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [mySlots, setMySlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [swapData, setSwapData] = useState({ requestingSlot: '', targetSlot: '' });
  
  // Attendance states
  const [currentAttendanceSlot, setCurrentAttendanceSlot] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: true/false }
  
  const [loading, setLoading] = useState(false);

  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

  const fetchSlots = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const clsRes = await axios.get(`${API_BASE_URL}/api/classes`, config);
      
      let allFoundSlots = [];
      for (const cls of clsRes.data) {
        const timeRes = await axios.get(`${API_BASE_URL}/api/timetable/class/${cls._id}`, config);
        allFoundSlots = [...allFoundSlots, ...timeRes.data];
      }

      setAllSlots(allFoundSlots);
      
      const mine = allFoundSlots.filter(s => s.teacher && s.teacher._id === userInfo._id);
      setMySlots(mine);
      
    } catch (error) {
      console.error('Error fetching slots', error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const res = await axios.get(`${API_BASE_URL}/api/swaps/my-requests`, config);
      setMyRequests(res.data);
    } catch (error) {
      console.error('Error fetching swap requests', error);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const res = await axios.get(`${API_BASE_URL}/api/swaps/incoming`, config);
      setIncomingRequests(res.data);
    } catch (error) {
      console.error('Error fetching incoming swap requests', error);
    }
  };

  const handleSwapResponse = async (id, action) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`${API_BASE_URL}/api/swaps/${id}/${action}`, {}, config);
      alert(action === 'accept' ? 'Swap accepted! Timetable updated.' : 'Swap declined.');
      fetchIncomingRequests();
      fetchSlots(); // Refresh schedule if swap was accepted
    } catch (error) {
      alert(error.response?.data?.message || `Error responding to swap`);
    }
  };

  useEffect(() => {
    fetchSlots();
    fetchMyRequests();
    fetchIncomingRequests();
  }, []);

  const handleRequestSwap = async (e) => {
    // ... swap logic remains unchanged
    e.preventDefault();
    if (!swapData.requestingSlot || !swapData.targetSlot) return alert('Select both slots');
    setLoading(true);

    try {
      const target = allSlots.find(s => s._id === swapData.targetSlot);
      if (!target || !target.teacher) {
        setLoading(false);
        return alert('Invalid target slot or no teacher assigned to it');
      }

      await axios.post(`${API_BASE_URL}/api/swaps`, {
        requestingSlot: swapData.requestingSlot,
        targetSlot: swapData.targetSlot,
        targetTeacher: target.teacher._id
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      setShowSwapModal(false);
      setSwapData({ requestingSlot: '', targetSlot: '' });
      alert('Swap request submitted to the target teacher successfully!');
      fetchMyRequests(); // Refresh the requests list
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating swap request');
    } finally {
      setLoading(false);
    }
  };

  const openAttendanceModal = async (slot) => {
    setCurrentAttendanceSlot(slot);
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/users/class/${slot.class._id}/students`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setClassStudents(data);
      // Initialize all as present by default
      const initialAttendance = {};
      data.forEach(student => {
        initialAttendance[student._id] = true;
      });
      setAttendanceData(initialAttendance);
      setShowAttendanceModal(true);
    } catch (error) {
      alert('Error fetching students for this class');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const submitAttendance = async () => {
    const presentStudents = Object.keys(attendanceData).filter(id => attendanceData[id]);
    const absentStudents = Object.keys(attendanceData).filter(id => !attendanceData[id]);

    try {
      await axios.post(`${API_BASE_URL}/api/attendance`, {
        classId: currentAttendanceSlot.class._id,
        subjectId: currentAttendanceSlot.subject._id,
        date: new Date(),
        presentStudents,
        absentStudents
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      alert('Attendance saved successfully!');
      setShowAttendanceModal(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving attendance');
    }
  };

  return (
    <div className="portal-page" style={{ position: 'relative' }}>
      <div className="page-header">
        <div>
          <h1>Teacher Dashboard</h1>
          <p className="text-secondary">View your upcoming classes and manage swap requests.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowSwapModal(true)}>Request Swap</button>
      </div>

      <div className="dashboard-content" style={{ gridTemplateColumns: '1fr', marginTop: '2rem' }}>
        <div className="card upcoming-classes">
          <h2>Your Schedule Overview</h2>
          <div className="class-list" style={{ marginTop: '1rem' }}>
            {mySlots.length === 0 ? <p>No classes scheduled yet.</p> : mySlots.map(slot => (
               <div className="class-item" key={slot._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="class-time" style={{ minWidth: '150px' }}>{slot.dayOfWeek} • {slot.startTime}</div>
                  <div className="class-info">
                    <h4 style={{ margin: 0 }}>{slot.subject?.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{slot.class?.name} • {slot.room || 'TBA'}</p>
                  </div>
                </div>
                <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openAttendanceModal(slot)}>
                  {loading && currentAttendanceSlot?._id === slot._id ? 'Loading...' : 'Mark Attendance'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Incoming Swap Requests */}
        {incomingRequests.length > 0 && (
          <div className="card" style={{ marginTop: '2rem', border: '2px solid #F59E0B' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#F59E0B', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{incomingRequests.length}</span>
              Incoming Swap Requests
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', marginTop: '0.25rem' }}>A fellow teacher wants to swap a slot with you. Review and respond below.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {incomingRequests.map(req => (
                <div key={req._id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>From: {req.requestingTeacher?.name}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                      <strong>Their slot:</strong> {req.requestingSlot ? `${req.requestingSlot.dayOfWeek} ${req.requestingSlot.startTime} — ${req.requestingSlot.subject?.name}` : 'Slot Deleted'}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, marginTop: '0.15rem' }}>
                      <strong>Your slot:</strong> {req.targetSlot ? `${req.targetSlot.dayOfWeek} ${req.targetSlot.startTime} — ${req.targetSlot.subject?.name}` : 'Slot Deleted'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      style={{ backgroundColor: '#10B981', padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                      onClick={() => handleSwapResponse(req._id, 'accept')}
                    >
                      ✓ Accept
                    </button>
                    <button
                      className="btn-primary"
                      style={{ backgroundColor: '#EF4444', padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                      onClick={() => handleSwapResponse(req._id, 'decline')}
                    >
                      ✗ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card swap-requests-status" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>My Sent Swap Requests</h2>
            {myRequests.length > 5 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Showing last 5 of {myRequests.length}</span>
            )}
          </div>
          <div className="table-responsive" style={{ marginTop: '1rem' }}>
            <table className="timetable-grid" style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  <th>Requested Slot</th>
                  <th>Target Slot</th>
                  <th>Target Teacher</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No swap requests sent yet.</td></tr>
                ) : myRequests.slice(0, 5).map(req => (
                  <tr key={req._id} style={{ textAlign: 'center' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500 }}>
                        {req.requestingSlot ? (
                          `${req.requestingSlot.startTime} - ${req.requestingSlot.subject?.name || 'Subject Missing'} , ${req.requestingSlot.dayOfWeek}`
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Slot Deleted</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {req.targetSlot ? (
                          `${req.targetSlot.startTime} - ${req.targetSlot.subject?.name || 'Subject Missing'} , ${req.targetSlot.dayOfWeek}`
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Slot Deleted</span>
                        )}
                      </div>
                    </td>
                    <td>{req.targetTeacher?.name}</td>
                    <td>
                      <span className="class-prof" style={{
                        backgroundColor: req.status === 'approved' ? '#D1FAE5' : req.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                        color: req.status === 'approved' ? '#059669' : req.status === 'rejected' ? '#DC2626' : '#D97706',
                        borderColor: 'transparent'
                      }}>
                        {req.status === 'pending'
                          ? ((!req.targetTeacherStatus || req.targetTeacherStatus === 'pending') ? 'AWAITING TEACHER' : req.targetTeacherStatus.toUpperCase())
                          : req.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {myRequests.length > 5 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '0.6rem 1rem', borderTop: '1px solid var(--border-color)', margin: 0 }}>
                ℹ Full history is available in the HOD Swap Requests page.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Swap Modal */}
      {showSwapModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>Request a Swap</h2>
              <button onClick={() => setShowSwapModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleRequestSwap} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Your Slot to Give Up</label>
                <select className="input-field" value={swapData.requestingSlot} onChange={e => setSwapData({...swapData, requestingSlot: e.target.value})} required>
                  <option value="">-- Select Your Slot --</option>
                  {mySlots.map(s => <option key={s._id} value={s._id}>{s.dayOfWeek} {s.startTime} - {s.subject?.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Target Slot to Take</label>
                <select className="input-field" value={swapData.targetSlot} onChange={e => setSwapData({...swapData, targetSlot: e.target.value})} required>
                  <option value="">-- Select Target Slot --</option>
                  {allSlots.filter(s => s.teacher && s.teacher._id !== userInfo._id).map(s => (
                    <option key={s._id} value={s._id}>
                      {s.dayOfWeek} {s.startTime} - {s.teacher?.name} ({s.subject?.name})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Send Swap Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content card" style={{ maxWidth: '600px', width: '100%', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>Mark Attendance</h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{currentAttendanceSlot?.subject?.name} - {currentAttendanceSlot?.class?.name}</p>
              </div>
              <button onClick={() => setShowAttendanceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.length === 0 ? (
                    <tr><td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No students enrolled in this class.</td></tr>
                  ) : classStudents.map(student => (
                    <tr key={student._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>{student.name}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => toggleAttendance(student._id)}
                          style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            backgroundColor: attendanceData[student._id] ? '#D1FAE5' : '#FEE2E2',
                            color: attendanceData[student._id] ? '#059669' : '#DC2626',
                            transition: 'all 0.2s'
                          }}
                        >
                          {attendanceData[student._id] ? 'Present' : 'Absent'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn-primary" onClick={submitAttendance} disabled={classStudents.length === 0}>
              <Check size={16} /> Save Attendance
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherDashboard;
