import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sort, setSort] = useState({ field: 'name', order: 'asc' });
  const [error, setError] = useState('');

  const fetchUsers = () => {
    const params = { ...filters, sortBy: sort.field, sortOrder: sort.order };
    api
      .get('/admin/users', { params })
      .then(({ data }) => setUsers(data.users))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'));
  };

  useEffect(fetchUsers, [sort]);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const applyFilters = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const toggleSort = (field) => {
    setSort((prev) =>
      prev.field === field ? { field, order: prev.order === 'asc' ? 'desc' : 'asc' } : { field, order: 'asc' }
    );
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Users</h1>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="filters-row" onSubmit={applyFilters}>
        <input name="name" placeholder="Filter by name" value={filters.name} onChange={handleFilterChange} />
        <input name="email" placeholder="Filter by email" value={filters.email} onChange={handleFilterChange} />
        <input name="address" placeholder="Filter by address" value={filters.address} onChange={handleFilterChange} />
        <select name="role" value={filters.role} onChange={handleFilterChange}>
          <option value="">All Roles</option>
          <option value="ADMIN">System Administrator</option>
          <option value="NORMAL_USER">Normal User</option>
          <option value="STORE_OWNER">Store Owner</option>
        </select>
        <button className="btn" type="submit">Apply</button>
      </form>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')}>Name</th>
              <th onClick={() => toggleSort('email')}>Email</th>
              <th onClick={() => toggleSort('address')}>Address</th>
              <th onClick={() => toggleSort('role')}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><Link to={`/admin/users/${u.id}`}>{u.name}</Link></td>
                <td>{u.email}</td>
                <td>{u.address}</td>
                <td><span className="badge">{u.role.replace('_', ' ')}</span></td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="4" style={{ color: '#64748b' }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
