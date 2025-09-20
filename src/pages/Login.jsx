import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1A202C] via-[#051E2F] to-[#0A0E14] font-['Bricolage_Grotesque'] p-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-br from-[#B38939]/20 to-[#D4AF37]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-4 w-96 h-96 bg-gradient-to-bl from-[#D4AF37]/15 to-[#B38939]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-1/3 w-80 h-80 bg-gradient-to-tr from-[#B38939]/10 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main Login Container */}
      <div className="relative z-10 pt-10 pb-5 w-full max-w-md">
        {/* Logo and Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B38939] via-[#D4AF37] to-[#B38939] bg-clip-text text-transparent mb-1 tracking-tight">
            Sylo Admin
          </h1>
          <p className="text-gray-400 text-sm font-medium">Management Portal</p>
          <div className="w-20 h-1 bg-gradient-to-r from-[#B38939] to-[#D4AF37] mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 transform transition-all duration-500 hover:shadow-3xl">
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to access your admin dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl transform transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EnvelopeIcon className={`w-5 h-5 transition-colors duration-200 ${
                    focusedField === 'email' ? 'text-[#B38939]' : 'text-gray-400'
                  }`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white focus:outline-none ${
                    focusedField === 'email'
                      ? 'border-[#B38939] ring-4 ring-[#B38939]/20 shadow-lg'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className={`w-5 h-5 transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-[#B38939]' : 'text-gray-400'
                  }`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-12 pr-12 py-4 border-2 rounded-2xl transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white focus:outline-none ${
                    focusedField === 'password'
                      ? 'border-[#B38939] ring-4 ring-[#B38939]/20 shadow-lg'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#B38939] transition-colors duration-200 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className={`w-full relative overflow-hidden group transition-all duration-300 transform ${
                  isLoading || !email || !password
                    ? 'opacity-50 cursor-not-allowed bg-gray-400'
                    : 'hover:scale-105 hover:shadow-2xl'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#B38939] via-[#D4AF37] to-[#B38939] rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#B38939] via-[#D4AF37] to-[#B38939] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                <div className="relative px-6 py-4 bg-gradient-to-r from-[#B38939] to-[#D4AF37] rounded-2xl border border-[#B38939]/20">
                  <div className="flex items-center justify-center space-x-3">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-white font-bold text-lg">Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-white font-bold text-lg">Sign In</span>
                        <ArrowRightIcon className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-blue-800 text-sm font-medium">
                  Secure admin access with enterprise-grade encryption
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
            <span>System Status: Operational</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            © 2024 Sylo Admin Portal. All rights reserved.
          </div>
        </div>
      </div>

      {/* Additional Visual Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-8 w-2 h-2 bg-[#B38939] rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-12 w-1 h-1 bg-[#D4AF37] rounded-full animate-ping delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 bg-[#B38939] rounded-full animate-ping delay-2000"></div>
      </div>
    </div>
  );
};

export default Login;