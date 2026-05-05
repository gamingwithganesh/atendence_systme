import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

  const fetchTeachers = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/users/teacher`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers', error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/users/teacher`, formData, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setShowForm(false);
      setFormData({ name: '', email: '', password: '' });
      fetchTeachers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding teacher');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Are you sure you want to remove this teacher?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/users/teacher/${id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      fetchTeachers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting teacher');
    }
  };

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Manage Teachers</h1>
          <p className="text-secondary">Add and manage teachers in your department.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add New Teacher'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Add New Teacher</h3>
          <form onSubmit={handleAddTeacher} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <input className="input-field" style={{ flex: 1, minWidth: '200px' }} placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <input type="email" className="input-field" style={{ flex: 1, minWidth: '200px' }} placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <input type="password" className="input-field" style={{ flex: 1, minWidth: '200px' }} placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            <button type="submit" className="btn-primary">Save Teacher</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="timetable-grid" style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No teachers found.</td></tr>
            ) : teachers.map(teacher => (
              <tr key={teacher._id} style={{ textAlign: 'center' }}>
                <td style={{ padding: '1rem' }}>{teacher.name}</td>
                <td>{teacher.email}</td>
                <td><span className="class-prof">{teacher.department}</span></td>
                <td>
                  <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: 'transparent' }} onClick={() => handleDeleteTeacher(teacher._id)}>
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

export default ManageTeachers;
