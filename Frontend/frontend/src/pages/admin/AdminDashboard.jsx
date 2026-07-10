import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load stats'));
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value">{stats.totalUsers}</div>
            <div className="label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.totalStores}</div>
            <div className="label">Total Stores</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.totalRatings}</div>
            <div className="label">Total Ratings Submitted</div>
          </div>
        </div>
      )}
    </div>
  );
}
