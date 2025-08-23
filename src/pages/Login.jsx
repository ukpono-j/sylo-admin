import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/api/admin/login', {
        email,
        password,
      });
      const { accessToken } = response.data;
      localStorage.setItem('adminToken', accessToken);
      toast.success('Login successful!', { autoClose: 1500 });
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#051E2F] to-[#1A202C]">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:scale-105">
        <h2 className="text-3xl font-semibold text-[#1A202C] mb-6 text-center tracking-tight">Sylo Admin Login</h2>
        {error && (
          <p className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded">{error}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#1A202C] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-[#B38939] transition-colors duration-200"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#1A202C] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-[#B38939] transition-colors duration-200"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#B38939] text-white p-3 rounded-lg hover:bg-[#BB954D] transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;