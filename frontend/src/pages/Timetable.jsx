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

const MAX_WEEKLY_HOURS = 25; // 25 hrs/week = 100% stress

const Timetable = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherStressData, setTeacherStressData] = useState([]); // [{teacher, hours, pct}]
  
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

  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

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

        // Pass class list directly — state may not be set yet
        fetchAllTeacherStress(classRes.data);
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

  // Fetch ALL class timetables to calculate per-teacher stress
  const fetchAllTeacherStress = async (allClasses) => {
    if (userInfo.role !== 'hod') return;
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const classList = allClasses || classes;
      const allSlots = [];
      for (const cls of classList) {
        const { data } = await axios.get(`http://localhost:5001/api/timetable/class/${cls._id}`, config);
        allSlots.push(...data);
      }

      // Group by teacher and sum minutes
      const teacherMap = {};
      allSlots.forEach(slot => {
        if (!slot.teacher) return;
        const tid = slot.teacher._id;
        const tname = slot.teacher.name;
        const startMins = timeToMins(slot.startTime);
        const endMins   = timeToMins(slot.endTime);
        const mins = Math.max(0, endMins - startMins);
        if (!teacherMap[tid]) teacherMap[tid] = { name: tname, mins: 0 };
        teacherMap[tid].mins += mins;
      });

      const result = Object.entries(teacherMap)
        .map(([id, { name, mins }]) => ({
          id, name,
          hours: parseFloat((mins / 60).toFixed(1)),
          pct: Math.min(100, Math.round((mins / 60 / MAX_WEEKLY_HOURS) * 100)),
        }))
        .sort((a, b) => b.pct - a.pct);

      setTeacherStressData(result);
    } catch (err) {
      console.error('Error computing teacher stress', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable(selectedClass);
      fetchAllTeacherStress();
    }
  }, [selectedClass]);

  const handleAutoGenerate = async () => {
    if (!selectedClass) return alert('Select a class first');
    setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/timetable/auto-generate', { classId: selectedClass }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      await fetchTimetable(selectedClass);
      await fetchAllTeacherStress();
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
    
    // Find subject duration
    const subjectObj = subjects.find(s => s._id === slotData.subject);
    const durationMins = subjectObj?.duration || 60;
    
    // Calculate end time
    const [startHourStr, startMinStr] = slotData.startTime.split(':');
    const totalStartMins = parseInt(startHourStr) * 60 + parseInt(startMinStr);
    const totalEndMins = totalStartMins + durationMins;
    
    const endHour = Math.floor(totalEndMins / 60);
    const endMin = totalEndMins % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    try {
      await axios.post('http://localhost:5001/api/timetable', {
        ...slotData,
        class: selectedClass,
        endTime
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setShowModal(false);
      await fetchTimetable(selectedClass);
      await fetchAllTeacherStress();
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
      await fetchTimetable(selectedClass);
      await fetchAllTeacherStress();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting slot');
    }
  };

  const getSlotData = (day, time) => {
    return timetableData.find(slot => slot.dayOfWeek === day && slot.startTime === time);
  };

  const handleDrop = async (e, targetDay, targetTime) => {
    e.preventDefault();
    if (userInfo.role !== 'hod') return;
    
    const sourceSlotId = e.dataTransfer.getData('slotId');
    if (!sourceSlotId) return;

    try {
      await axios.post('http://localhost:5001/api/timetable/move', {
        sourceSlotId,
        targetDay,
        targetTime
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      await fetchTimetable(selectedClass);
      await fetchAllTeacherStress();
    } catch (error) {
      alert(error.response?.data?.message || 'Error moving slot');
    }
  };

  // Pre-compute rowSpans and skipped cells
  const skipCells = new Set();
  const slotSpans = {};

  timetableData.forEach(slot => {
    const startIndex = timeslots.indexOf(slot.startTime);
    if (startIndex !== -1) {
      const [startH, startM] = slot.startTime.split(':');
      const [endH, endM] = slot.endTime.split(':');
      const diffMins = (parseInt(endH) * 60 + parseInt(endM)) - (parseInt(startH) * 60 + parseInt(startM));
      const span = Math.max(1, Math.round(diffMins / 60));
      slotSpans[slot._id] = span;

      let skipped = 0;
      let currIndex = startIndex + 1;
      while (skipped < span - 1 && currIndex < timeslots.length) {
        const time = timeslots[currIndex];
        if (time !== '13:30') {
          skipCells.add(`${slot.dayOfWeek}-${time}`);
          skipped++;
        }
        currIndex++;
      }
    }
  });

  const timeToMins = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':');
    return parseInt(h) * 60 + parseInt(m);
  };

  const calculateClassDensity = () => {
    let totalMins = 0;
    timetableData.forEach(slot => {
      const start = timeToMins(slot.startTime);
      const end = timeToMins(slot.endTime);
      totalMins += (end - start);
    });
    const maxMins = 33 * 60; // 33 hours max per week
    return Math.min(100, Math.round((totalMins / maxMins) * 100));
  };

  const getDensityColor = (percentage) => {
    if (percentage < 50) return '#10B981';
    if (percentage < 80) return '#F59E0B';
    return '#EF4444';
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="input-group inline-group" style={{ marginBottom: 0 }}>
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

          {timetableData.length > 0 && (
            <div style={{ flex: '1', maxWidth: '300px', minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span className="text-secondary" style={{ fontWeight: 500 }}>Schedule Density (Class Stress)</span>
                <span style={{ fontWeight: 700, color: getDensityColor(calculateClassDensity()) }}>
                  {calculateClassDensity()}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${calculateClassDensity()}%`, 
                    backgroundColor: getDensityColor(calculateClassDensity()),
                    transition: 'all 0.5s ease-out'
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Teacher Stress Levels Panel (HOD only) ── */}
      {userInfo.role === 'hod' && teacherStressData.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>👩‍🏫 Teacher Workload Stress</h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Based on all assigned classes &nbsp;•&nbsp; Max capacity: {MAX_WEEKLY_HOURS} hrs/week
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981', display: 'inline-block' }} />
                &lt; 60% Safe
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B', display: 'inline-block' }} />
                60–85% High
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444', display: 'inline-block' }} />
                &gt; 85% Overloaded
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {teacherStressData.map(t => {
              const color = t.pct < 60 ? '#10B981' : t.pct < 85 ? '#F59E0B' : '#EF4444';
              const bg    = t.pct < 60 ? '#D1FAE5' : t.pct < 85 ? '#FEF3C7' : '#FEE2E2';
              const label = t.pct < 60 ? 'Safe' : t.pct < 85 ? 'High Load' : 'Overloaded';
              return (
                <div
                  key={t.id}
                  style={{
                    background: 'var(--surface-color)',
                    border: `1px solid ${t.pct >= 85 ? '#FCA5A5' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    boxShadow: t.pct >= 85 ? '0 0 0 2px rgba(239,68,68,0.15)' : 'none',
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</span>
                    <span style={{
                      backgroundColor: bg, color, fontSize: '0.7rem', fontWeight: 700,
                      padding: '0.15rem 0.5rem', borderRadius: '20px'
                    }}>
                      {label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1, height: '7px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${t.pct}%`,
                        background: color,
                        borderRadius: '4px',
                        transition: 'width 0.6s ease-out',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color, minWidth: '60px', textAlign: 'right' }}>
                      {t.hours}h / {MAX_WEEKLY_HOURS}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                        const cellKey = `${day}-${slotTime}`;
                        if (skipCells.has(cellKey)) return null;

                        const isSatOff = day === 'Saturday' && ['14:00', '15:00', '16:00'].includes(slotTime);
                        const cellData = getSlotData(day, slotTime);
                        const rowSpan = cellData ? (slotSpans[cellData._id] || 1) : 1;

                        return (
                          <td 
                            key={cellKey} 
                            rowSpan={rowSpan}
                            className={`grid-cell ${isSatOff ? 'off-cell' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={(e) => handleDrop(e, day, slotTime)}
                          >
                            {isSatOff ? (
                              <div className="empty-cell" style={{ cursor: 'not-allowed', opacity: 0.5 }}>OFF</div>
                            ) : cellData ? (
                              <div 
                                className="cell-content" 
                                style={{ position: 'relative', height: '100%', cursor: userInfo.role === 'hod' ? 'grab' : 'default' }}
                                draggable={userInfo.role === 'hod'}
                                onDragStart={(e) => { e.dataTransfer.setData('slotId', cellData._id); }}
                              >
                                {userInfo.role === 'hod' && (
                                  <button 
                                    onClick={() => handleDeleteSlot(cellData._id)}
                                    style={{ position: 'absolute', top: '2px', right: '2px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px', zIndex: 10 }}
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
