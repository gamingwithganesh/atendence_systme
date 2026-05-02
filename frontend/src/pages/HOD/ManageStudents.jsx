import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', enrolledClass: '' });
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      // Note: We need a backend API to fetch all students for the HOD's department
      // We don't have one yet. We have GET /api/users/class/:classId/students
      // Let's create a generic GET /api/users/student for HODs in userRoutes if it doesn't exist
      // For now, we'll fetch classes, then fetch students for each class
      const clsRes = await axios.get('http://localhost:5001/api/classes', config);
      setClasses(clsRes.data);

      let allStudents = [];
      for (const cls of clsRes.data) {
        const stuRes = await axios.get(`http://localhost:5001/api/users/class/${cls._id}/students`, config);
        // Attach class name for display
        const studentsWithClass = stuRes.data.map(s => ({...s, className: cls.name}));
        allStudents = [...allStudents, ...studentsWithClass];
      }
      setStudents(allStudents);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!formData.enrolledClass) return alert('Please select a class');
    
    try {
      await axios.post('http://localhost:5001/api/users/student', formData, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', enrolledClass: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding student');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/users/student/${id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting student');
    }
  };

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Manage Students</h1>
          <p className="text-secondary">Enroll students and assign them to classes.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add New Student'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#EEF2FF' }}>
          <h3>Add New Student</h3>
          <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <input className="input-field" style={{ flex: 1, minWidth: '150px' }} placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <input type="email" className="input-field" style={{ flex: 1, minWidth: '150px' }} placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <input type="password" className="input-field" style={{ flex: 1, minWidth: '150px' }} placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            
            <select className="input-field" style={{ flex: 1, minWidth: '150px' }} value={formData.enrolledClass} onChange={(e) => setFormData({...formData, enrolledClass: e.target.value})} required>
              <option value="">-- Assign Class --</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>

            <button type="submit" className="btn-primary">Enroll Student</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="timetable-grid" style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Enrolled Class</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No students found.</td></tr>
            ) : students.map(student => (
              <tr key={student._id} style={{ textAlign: 'center' }}>
                <td style={{ padding: '1rem' }}>{student.name}</td>
                <td>{student.email}</td>
                <td><span className="class-prof" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>{student.className}</span></td>
                <td>
                  <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: 'transparent' }} onClick={() => handleDeleteStudent(student._id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageStudents;
