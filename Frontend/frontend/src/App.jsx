import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import UpdatePassword from './pages/UpdatePassword';

import AdminDashboard from './pages/admin/AdminDashboard';
import UsersList from './pages/admin/UserList';
import UserDetail from './pages/admin/UserDetail';
import StoresList from './pages/admin/StoresList';
import AddUser from './pages/admin/AddUser';
import AddStore from './pages/admin/AddStore';

import StoreList from './pages/user/StoreList';

import StoreOwnerDashboard from './pages/storeowner/StoreOwnerDashboard';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'STORE_OWNER') return <Navigate to="/store-owner/dashboard" replace />;
  return <Navigate to="/stores" replace />;
} 

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/update-password"
          element={
            <PrivateRoute>
              <UpdatePassword />
            </PrivateRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <UsersList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users/add"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AddUser />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <UserDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/stores"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <StoresList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/stores/add"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AddStore />
            </PrivateRoute>
          }
        />

        {/* Normal user routes */}
        <Route
          path="/stores"
          element={
            <PrivateRoute allowedRoles={['NORMAL_USER']}>
              <StoreList />
            </PrivateRoute>
          }
        />

        {/* Store owner routes */}
        <Route
          path="/store-owner/dashboard"
          element={
            <PrivateRoute allowedRoles={['STORE_OWNER']}>
              <StoreOwnerDashboard />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
