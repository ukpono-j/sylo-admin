import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import Withdrawals from './pages/Withdrawals';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isTokenValid = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      if (payload.exp < currentTime) {
        console.log('Token expired, removing from localStorage');
        localStorage.removeItem('adminToken');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error parsing token:', error);
      localStorage.removeItem('adminToken');
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const validToken = isTokenValid();
      setIsAuthenticated(validToken);
      setIsLoading(false);
    };

    checkAuth();

    const tokenCheckInterval = setInterval(() => {
      if (isAuthenticated && !isTokenValid()) {
        setIsAuthenticated(false);
        console.log('Token expired during session, logging out...');
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(tokenCheckInterval);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B38939] mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
          <Navigate to="/" replace /> : 
          <Login setIsAuthenticated={setIsAuthenticated} />
        } 
      />
      <Route
        path="/"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/users"
        element={isAuthenticated ? <Users /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/transactions"
        element={isAuthenticated ? <Transactions /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/withdrawals"
        element={isAuthenticated ? <Withdrawals /> : <Navigate to="/login" replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

export default App;