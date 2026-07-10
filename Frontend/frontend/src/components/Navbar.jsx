import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <div className="brand">Store Ratings</div>
      <div className="nav-links">
        {user.role === 'ADMIN' && (
          <>
            <Link to="/admin/dashboard">Dashboard</Link>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/stores">Stores</Link>
            <Link to="/admin/users/add">Add User</Link>
            <Link to="/admin/stores/add">Add Store</Link>
          </>
        )}
        {user.role === 'NORMAL_USER' && (
          <>
            <Link to="/stores">Stores</Link>
          </>
        )}
        {user.role === 'STORE_OWNER' && (
          <>
            <Link to="/store-owner/dashboard">Dashboard</Link>
          </>
        )}
        <Link to="/update-password">Update Password</Link>
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
          {user.name} ({user.role.replace('_', ' ')})
        </span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
