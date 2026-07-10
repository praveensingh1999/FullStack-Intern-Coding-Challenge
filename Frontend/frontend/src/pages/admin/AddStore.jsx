import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AddStore() {
  const [form, setForm] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [owners, setOwners] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/store-owners').then(({ data }) => setOwners(data.owners)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setLoading(true);
    try {
      await api.post('/admin/stores', { ...form, ownerId: form.ownerId || null });
      setSuccess('Store created successfully');
      setForm({ name: '', email: '', address: '', ownerId: '' });
    } catch (err) {
      if (err.response?.data?.errors) setFieldErrors(err.response.data.errors);
      setError(err.response?.data?.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Add New Store</h1>
      </div>
      <div className="card">
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Store Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
            {fieldErrors.name && <span className="error-text">{fieldErrors.name}</span>}
          </div>
          <div className="form-group">
            <label>Store Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
            {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>Address</label>
            <input name="address" value={form.address} onChange={handleChange} required />
            {fieldErrors.address && <span className="error-text">{fieldErrors.address}</span>}
          </div>
          <div className="form-group">
            <label>Assign Store Owner (optional)</label>
            <select name="ownerId" value={form.ownerId} onChange={handleChange}>
              <option value="">-- None --</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.email})
                </option>
              ))}
            </select>
            {fieldErrors.ownerId && <span className="error-text">{fieldErrors.ownerId}</span>}
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Store'}
          </button>
        </form>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
        Tip: create a user with role "Store Owner" first (via Add User), then assign them here.
      </p>
    </div>
  );
}
