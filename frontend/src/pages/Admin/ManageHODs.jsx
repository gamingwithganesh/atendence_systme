import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const ManageHODs = () => {
  const [hods, setHods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department: '' });
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

  const fetchHODs = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/users/hod`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setHods(data);
    } catch (error) {
      console.error('Error fetching HODs', error);
    }
  };

  useEffect(() => {
    fetchHODs();
  }, []);

  const handleAddHOD = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/users/hod`, formData, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', department: '' });
      fetchHODs(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding HOD');
    }
  };

    const handleDeleteHOD = async (id) => {
    if (!window.confirm('Are you sure you want to remove this HOD?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/users/hod/${id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      fetchHODs();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting HOD');
    }
  };

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Manage Head of Departments</h1>
          <p className="text-secondary">Add and manage HODs for different departments.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add New HOD'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#EEF2FF' }}>
          <h3>Add New HOD</h3>
          <form onSubmit={handleAddHOD} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <input className="input-field" style={{ flex: 1, minWidth: '200px' }} placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <input type="email" className="input-field" style={{ flex: 1, minWidth: '200px' }} placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <input type="password" className="input-field" style={{ flex: 1, minWidth: '200px' }} placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            
            <select className="input-field" style={{ flex: 1, minWidth: '200px' }} value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required>
              <option value="">-- Select Department --</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="Mechanical">Mechanical Engineering</option>
              <option value="ENTC">Electronics & Telecommunication (ENTC)</option>
              <option value="Civil">Civil Engineering</option>
              <option value="Electrical">Electrical Engineering</option>
              <option value="IT">Information Technology (IT)</option>
            </select>

            <button type="submit" className="btn-primary">Save HOD</button>
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
            {hods.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No HODs found.</td></tr>
            ) : hods.map(hod => (
              <tr key={hod._id} style={{ textAlign: 'center' }}>
                <td style={{ padding: '1rem' }}>{hod.name}</td>
                <td>{hod.email}</td>
                <td><span className="class-prof" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>{hod.department}</span></td>
                <td>
                  <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: 'transparent' }} onClick={() => handleDeleteHOD(hod._id)}>
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

export default ManageHODs;
