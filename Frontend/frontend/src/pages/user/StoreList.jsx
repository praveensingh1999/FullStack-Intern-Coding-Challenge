import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StarRating from '../../components/StarRating';

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [sort, setSort] = useState({ field: 'name', order: 'asc' });
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const fetchStores = () => {
    const params = { ...filters, sortBy: sort.field, sortOrder: sort.order };
    api
      .get('/user/stores', { params })
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

  const submitRating = async (storeId, value) => {
    setSavingId(storeId);
    setError('');
    try {
      await api.post('/user/ratings', { storeId, value });
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, myRating: value } : s))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Browse Stores</h1>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="filters-row" onSubmit={applyFilters}>
        <input name="name" placeholder="Search by store name" value={filters.name} onChange={handleFilterChange} />
        <input name="address" placeholder="Search by address" value={filters.address} onChange={handleFilterChange} />
        <button className="btn" type="submit">Search</button>
      </form>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')}>Store Name</th>
              <th onClick={() => toggleSort('address')}>Address</th>
              <th>Overall Rating</th>
              <th>Your Rating</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.address}</td>
                <td>{s.averageRating} ★</td>
                <td>
                  <StarRating
                    value={s.myRating || 0}
                    disabled={savingId === s.id}
                    onChange={(val) => submitRating(s.id, val)}
                  />
                  {s.myRating ? (
                    <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#64748b' }}>
                      (click a star to change)
                    </span>
                  ) : (
                    <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#64748b' }}>
                      (click to rate)
                    </span>
                  )}
                </td>
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
