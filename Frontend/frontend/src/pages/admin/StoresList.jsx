import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function StoresList() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  const [sort, setSort] = useState({ field: 'name', order: 'asc' });
  const [error, setError] = useState('');

  const fetchStores = () => {
    const params = { ...filters, sortBy: sort.field, sortOrder: sort.order };
    api
      .get('/admin/stores', { params })
      .then(({ data }) => setStores(data.stores))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load stores'));
  };

  useEffect(fetchStores, [sort]);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const applyFilters = (e) => {
    e.preventDefault();
    fetchStores();
  };

  const toggleSort = (field) => {
    setSort((prev) =>
      prev.field === field ? { field, order: prev.order === 'asc' ? 'desc' : 'asc' } : { field, order: 'asc' }
    );
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Stores</h1>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="filters-row" onSubmit={applyFilters}>
        <input name="name" placeholder="Filter by name" value={filters.name} onChange={handleFilterChange} />
        <input name="email" placeholder="Filter by email" value={filters.email} onChange={handleFilterChange} />
        <input name="address" placeholder="Filter by address" value={filters.address} onChange={handleFilterChange} />
        <button className="btn" type="submit">Apply</button>
      </form>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')}>Name</th>
              <th onClick={() => toggleSort('email')}>Email</th>
              <th onClick={() => toggleSort('address')}>Address</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.address}</td>
                <td>{s.averageRating} ★ ({s.ratingCount})</td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr><td colSpan="4" style={{ color: '#64748b' }}>No stores found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
