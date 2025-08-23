import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Custom event emitter for logout
const logoutEvent = new Event('logout');

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true/false = result

  const isTokenValid = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }
  };

  useEffect(() => {
    // Initial token check
    setIsAuthenticated(isTokenValid());

    // Periodic token check
    const tokenCheckInterval = setInterval(() => {
      if (!isTokenValid()) {
        setIsAuthenticated(false);
        console.log('Token expired during session, logging out...');
        // Trigger logout event for axiosConfig to handle
        window.dispatchEvent(logoutEvent);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Listen for logout events from axiosConfig
    const handleLogout = () => {
      setIsAuthenticated(false);
      toast.error('Session expired. Please login again.', { autoClose: 2000 });
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    };

    window.addEventListener('logout', handleLogout);

    return () => {
      clearInterval(tokenCheckInterval);
      window.removeEventListener('logout', handleLogout);
    };
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B38939] mx-auto mb-4"></div>
          <div className="text-gray-600">Checking authentication...</div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;