import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check } from 'lucide-react';

const TeacherDashboard = () => {
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [mySlots, setMySlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [swapData, setSwapData] = useState({ requestingSlot: '', targetSlot: '' });
  
  // Attendance states
  const [currentAttendanceSlot, setCurrentAttendanceSlot] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: true/false }
  
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const fetchSlots = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const clsRes = await axios.get('http://localhost:5001/api/classes', config);
      
      let allFoundSlots = [];
      for (const cls of clsRes.data) {
        const timeRes = await axios.get(`http://localhost:5001/api/timetable/class/${cls._id}`, config);
        allFoundSlots = [...allFoundSlots, ...timeRes.data];
      }

      setAllSlots(allFoundSlots);
      
      const mine = allFoundSlots.filter(s => s.teacher && s.teacher._id === userInfo._id);
      setMySlots(mine);
      
    } catch (error) {
      console.error('Error fetching slots', error);
    }
  };

  useEffect(() => {
    fetchSlots();
    
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
      
      mySlots.forEach(slot => {
        if (slot.dayOfWeek !== currentDay) return;
        
        const [hours, minutes] = slot.startTime.split(':');
        const lectureTime = new Date();
        lectureTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const diffMs = lectureTime - now;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins === 10) {
          // Native browser notification (if allowed)
          if (Notification.permission === 'granted') {
            new Notification('Upcoming Lecture Reminder!', {
              body: `Your ${slot.subject?.name} class for ${slot.class?.name} starts in 10 minutes at ${slot.room || 'TBA'}.`,
              icon: '/vite.svg'
            });
          }
          
          // In-App Toast Notification (always visible)
          setToastMessage(`Heads up! Your ${slot.subject?.name} class for ${slot.class?.name} starts in 10 minutes.`);
          setTimeout(() => setToastMessage(null), 15000); // Hide after 15 seconds
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [mySlots]);

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

      await axios.post('http://localhost:5001/api/swaps', {
        requestingSlot: swapData.requestingSlot,
        targetSlot: swapData.targetSlot,
        targetTeacher: target.teacher._id
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      setShowSwapModal(false);
      setSwapData({ requestingSlot: '', targetSlot: '' });
      alert('Swap request submitted to HOD successfully!');
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
      const { data } = await axios.get(`http://localhost:5001/api/users/class/${slot.class._id}/students`, {
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
      await axios.post('http://localhost:5001/api/attendance', {
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
      
      {/* In-App Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, backgroundColor: '#3B82F6', color: 'white', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'slideIn 0.3s ease-out' }}>
          <div>
            <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Upcoming Lecture</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.2rem' }}><X size={16} /></button>
        </div>
      )}

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
                {loading ? 'Submitting...' : 'Submit Request to HOD'}
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
