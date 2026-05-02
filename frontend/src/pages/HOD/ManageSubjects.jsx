import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  
  const [subjectData, setSubjectData] = useState({ name: '', code: '', lecturesPerWeek: 3, teacher: '' });
  const [classData, setClassData] = useState({ name: '', year: 1, semester: 1 });
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const subRes = await axios.get('http://localhost:5001/api/subjects', config);
      const clsRes = await axios.get('http://localhost:5001/api/classes', config);
      const teachRes = await axios.get('http://localhost:5001/api/users/teacher', config);
      
      setSubjects(subRes.data);
      setClasses(clsRes.data);
      setTeachers(teachRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      if (editingSubjectId) {
        await axios.put(`http://localhost:5001/api/subjects/${editingSubjectId}`, subjectData, config);
      } else {
        await axios.post('http://localhost:5001/api/subjects', subjectData, config);
      }
      setShowSubjectForm(false);
      setEditingSubjectId(null);
      setSubjectData({ name: '', code: '', lecturesPerWeek: 3, teacher: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving subject');
    }
  };

  const handleEditClick = (subject) => {
    setEditingSubjectId(subject._id);
    setSubjectData({
      name: subject.name,
      code: subject.code,
      lecturesPerWeek: subject.lecturesPerWeek,
      teacher: subject.teacher?._id || ''
    });
    setShowSubjectForm(true);
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/classes', classData, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setShowClassForm(false);
      setClassData({ name: '', year: 1, semester: 1 });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding class');
    }
  };

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Subjects & Classes</h1>
          <p className="text-secondary">Manage the curriculum for your department.</p>
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button className="btn-secondary" onClick={() => setShowClassForm(!showClassForm)}>+ Add Class</button>
          <button className="btn-primary" onClick={() => setShowSubjectForm(!showSubjectForm)}>+ Add Subject</button>
        </div>
      </div>

      {showClassForm && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#F9FAFB' }}>
          <h3>Add New Class</h3>
          <form onSubmit={handleAddClass} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <input className="input-field" style={{ flex: 1 }} placeholder="Class Name (e.g. CS - Year 1)" value={classData.name} onChange={(e) => setClassData({...classData, name: e.target.value})} required />
            <input type="number" className="input-field" style={{ flex: 1 }} placeholder="Year" value={classData.year} onChange={(e) => setClassData({...classData, year: e.target.value})} required />
            <input type="number" className="input-field" style={{ flex: 1 }} placeholder="Semester" value={classData.semester} onChange={(e) => setClassData({...classData, semester: e.target.value})} required />
            <button type="submit" className="btn-secondary">Save Class</button>
          </form>
        </div>
      )}

      {showSubjectForm && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#EEF2FF' }}>
          <h3>{editingSubjectId ? 'Edit Subject' : 'Add New Subject'}</h3>
          <form onSubmit={handleSaveSubject} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <input className="input-field" style={{ flex: 1 }} placeholder="Subject Name" value={subjectData.name} onChange={(e) => setSubjectData({...subjectData, name: e.target.value})} required />
            <input className="input-field" style={{ flex: 1 }} placeholder="Subject Code (e.g. CS101)" value={subjectData.code} onChange={(e) => setSubjectData({...subjectData, code: e.target.value})} required />
            <input type="number" className="input-field" style={{ flex: 1 }} placeholder="Lectures Per Week" value={subjectData.lecturesPerWeek} onChange={(e) => setSubjectData({...subjectData, lecturesPerWeek: e.target.value})} required />
            
            <select className="input-field" style={{ flex: 1 }} value={subjectData.teacher} onChange={(e) => setSubjectData({...subjectData, teacher: e.target.value})} required>
              <option value="">-- Assign Teacher --</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>

            <button type="submit" className="btn-primary">{editingSubjectId ? 'Update' : 'Save'} Subject</button>
            {editingSubjectId && <button type="button" className="btn-secondary" onClick={() => {setShowSubjectForm(false); setEditingSubjectId(null); setSubjectData({ name: '', code: '', lecturesPerWeek: 3, teacher: '' })}}>Cancel</button>}
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2>Classes</h2>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
            {classes.length === 0 ? <p>No classes found.</p> : classes.map(c => (
              <li key={c._id} style={{ padding: '0.8rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
                <strong>{c.name}</strong>
                <span className="text-secondary">Year {c.year} • Sem {c.semester}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="card">
          <h2>Subjects</h2>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
            {subjects.length === 0 ? <p>No subjects found.</p> : subjects.map(s => (
              <li key={s._id} style={{ padding: '0.8rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{s.name}</strong> <span style={{fontSize: '0.8rem', backgroundColor: '#E5E7EB', padding: '0.1rem 0.4rem', borderRadius: '4px'}}>{s.code}</span>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem'}}>Teacher: {s.teacher?.name || 'Unassigned'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="text-secondary">{s.lecturesPerWeek} lectures/wk</span>
                  <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleEditClick(s)}>Edit</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManageSubjects;
