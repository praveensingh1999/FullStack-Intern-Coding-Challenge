import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function StoreOwnerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/store-owner/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Store Owner Dashboard</h1>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {data && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="value">{data.averageRating}</div>
              <div className="label">Average Rating for {data.store.name}</div>
            </div>
            <div className="stat-card">
              <div className="value">{data.raters.length}</div>
              <div className="label">Total Ratings Received</div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Users Who Rated Your Store</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.raters.map((r) => (
                  <tr key={r.userId}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.rating} ★</td>
                  </tr>
                ))}
                {data.raters.length === 0 && (
                  <tr><td colSpan="3" style={{ color: '#64748b' }}>No ratings yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
