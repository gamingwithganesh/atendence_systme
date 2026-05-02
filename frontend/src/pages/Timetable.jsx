import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Download, RefreshCcw, X, Trash2 } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import './Timetable.css';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeslots = [
  '10:30',
  '11:30',
  '12:30',
  '13:30', // Lunch
  '14:00',
  '15:00',
  '16:00'
];

const formatTime = (timeStr) => {
  if (timeStr === '13:30') return '13:30 - 14:00 (Lunch)';
  if (timeStr === '10:30') return '10:30 - 11:30';
  if (timeStr === '11:30') return '11:30 - 12:30';
  if (timeStr === '12:30') return '12:30 - 13:30';
  if (timeStr === '14:00') return '14:00 - 15:00';
  if (timeStr === '15:00') return '15:00 - 16:00';
  if (timeStr === '16:00') return '16:00 - 17:00';
  return timeStr;
};

const Timetable = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [slotData, setSlotData] = useState({
    subject: '',
    teacher: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: ''
  });

  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const classRes = await axios.get('http://localhost:5001/api/classes', config);
      setClasses(classRes.data);
      if (classRes.data.length > 0) setSelectedClass(classRes.data[0]._id);

      if (userInfo.role === 'hod') {
        const subRes = await axios.get('http://localhost:5001/api/subjects', config);
        setSubjects(subRes.data);
        
        const teachRes = await axios.get('http://localhost:5001/api/users/teacher', config);
        setTeachers(teachRes.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown data', error);
    }
  };

  const fetchTimetable = async (classId) => {
    if (!classId) return;
    try {
      const { data } = await axios.get(`http://localhost:5001/api/timetable/class/${classId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setTimetableData(data);
    } catch (error) {
      console.error('Error fetching timetable', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchTimetable(selectedClass);
  }, [selectedClass]);

  const handleAutoGenerate = async () => {
    if (!selectedClass) return alert('Select a class first');
    setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/timetable/auto-generate', { classId: selectedClass }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      fetchTimetable(selectedClass);
      alert('Timetable generated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error generating timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddSlot = async (e) => {
    e.preventDefault();
    if (!selectedClass) return alert('Please select a class first');
    
    // Calculate end time
    const endHour = parseInt(slotData.startTime.split(':')[0]) + 1;
    const endTime = `${endHour}:00`;

    try {
      await axios.post('http://localhost:5001/api/timetable', {
        ...slotData,
        class: selectedClass,
        endTime
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setShowModal(false);
      fetchTimetable(selectedClass);
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding slot. Check for conflicts.');
    }
  };

  const handleExportPDF = () => {
    exportToPDF('timetable-grid-element', `Timetable_${selectedClass}.pdf`);
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this lecture slot?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/timetable/${slotId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      fetchTimetable(selectedClass);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting slot');
    }
  };

  const getSlotData = (day, time) => {
    return timetableData.find(slot => slot.dayOfWeek === day && slot.startTime === time);
  };

  return (
    <div className="timetable-page">
      <div className="page-header">
        <div>
          <h1>Timetable Management</h1>
          <p className="text-secondary">View and manage schedules for all classes.</p>
        </div>
        <div className="header-actions-group">
          {userInfo.role === 'hod' && (
            <button className="btn-secondary" onClick={handleAutoGenerate} disabled={loading}>
              <RefreshCcw size={16} /> {loading ? 'Generating...' : 'Auto-Generate'}
            </button>
          )}
          <button className="btn-secondary" onClick={handleExportPDF}>
            <Download size={16} /> Export PDF
          </button>
          {userInfo.role === 'hod' && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Slot Manually
            </button>
          )}
        </div>
      </div>

      <div className="card filters-card">
        <div className="input-group inline-group">
          <label className="input-label">Select Class:</label>
          <select 
            className="input-field select-field" 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.length === 0 && <option value="">No classes found</option>}
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card grid-card" id="timetable-grid-element">
        <div className="grid-wrapper">
          <table className="timetable-grid">
            <thead>
              <tr>
                <th className="time-col">Time</th>
                {days.map(day => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeslots.map((slotTime) => {
                const isLunch = slotTime === '13:30';
                return (
                  <tr key={slotTime} className={isLunch ? 'lunch-row' : ''}>
                    <td className="time-col">{formatTime(slotTime)}</td>
                    {isLunch ? (
                      <td colSpan={6} className="lunch-cell">BREAK / LUNCH</td>
                    ) : (
                      days.map(day => {
                        const isSatOff = day === 'Saturday' && ['14:00', '15:00', '16:00'].includes(slotTime);
                        const cellData = getSlotData(day, slotTime);
                        return (
                          <td key={`${day}-${slotTime}`} className={`grid-cell ${isSatOff ? 'off-cell' : ''}`}>
                            {isSatOff ? (
                              <div className="empty-cell" style={{ cursor: 'not-allowed', opacity: 0.5 }}>OFF</div>
                            ) : cellData ? (
                              <div className="cell-content" style={{ position: 'relative' }}>
                                {userInfo.role === 'hod' && (
                                  <button 
                                    onClick={() => handleDeleteSlot(cellData._id)}
                                    style={{ position: 'absolute', top: '2px', right: '2px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}
                                    title="Delete Slot"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                                <div className="cell-subject">{cellData.subject?.name}</div>
                                <div className="cell-details">
                                  <span>{cellData.teacher?.name}</span>
                                  <span>{cellData.room}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="empty-cell" onClick={() => {
                                if (userInfo.role === 'hod') {
                                  setSlotData({...slotData, dayOfWeek: day, startTime: slotTime});
                                  setShowModal(true);
                                }
                              }}>
                                {userInfo.role === 'hod' && <Plus size={16} className="add-icon"/>}
                              </div>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Slot Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>Assign Manual Slot</h2>
              <button onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleManualAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Day</label>
                  <select className="input-field" value={slotData.dayOfWeek} onChange={e => setSlotData({...slotData, dayOfWeek: e.target.value})} required>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Time</label>
                  <select className="input-field" value={slotData.startTime} onChange={e => setSlotData({...slotData, startTime: e.target.value})} required>
                    {timeslots.filter(t => t !== '13:30').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Subject</label>
                <select className="input-field" value={slotData.subject} onChange={e => setSlotData({...slotData, subject: e.target.value})} required>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Teacher</label>
                <select className="input-field" value={slotData.teacher} onChange={e => setSlotData({...slotData, teacher: e.target.value})} required>
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Room (Optional)</label>
                <input type="text" className="input-field" value={slotData.room} onChange={e => setSlotData({...slotData, room: e.target.value})} placeholder="e.g. Room 304" />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Save Timetable Slot</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
