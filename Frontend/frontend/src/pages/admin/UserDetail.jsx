import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

export default function UserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/admin/users/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load user'));
  }, [id]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>User Details</h1>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {data && (
        <div className="card" style={{ maxWidth: 480 }}>
          <p><strong>Name:</strong> {data.user.name}</p>
          <p><strong>Email:</strong> {data.user.email}</p>
          <p><strong>Address:</strong> {data.user.address}</p>
          <p><strong>Role:</strong> <span className="badge">{data.user.role.replace('_', ' ')}</span></p>
          {data.user.role === 'STORE_OWNER' && (
            <p><strong>Store Rating:</strong> {data.rating ? `${data.rating} ★` : 'No ratings yet'}</p>
          )}
        </div>
      )}
      <Link to="/admin/users">&larr; Back to Users</Link>
    </div>
  );
}
