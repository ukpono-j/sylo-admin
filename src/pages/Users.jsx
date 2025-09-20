import { useEffect, useState, useMemo, useCallback } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import moment from 'moment-timezone';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  UserCircleIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingLibraryIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

// Sidebar configuration for consistent dimensions
const SIDEBAR_CONFIG = {
  expanded: {
    margin: 'lg:ml-[280px]'
  },
  collapsed: {
    margin: 'lg:ml-[90px]'
  }
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const usersPerPage = 12;

  // Fetch users with enhanced error handling
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/users');
      const userData = response.data.data?.users || response.data.data;
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      if (axios.isCancel(error)) return;
      if (error.message === 'Session expired. Please login again.' ||
          error.message === 'Authentication failed. Please login again.') {
        return;
      }
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Enhanced filtering logic
  const filterUsers = useCallback(() => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm) ||
        user.bank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.accountNumber?.includes(searchTerm)
      );
    }

    if (filterType === 'admin') {
      filtered = filtered.filter(user => user.isAdmin);
    } else if (filterType === 'regular') {
      filtered = filtered.filter(user => !user.isAdmin);
    } else if (filterType === 'verified') {
      filtered = filtered.filter(user => user.bank && user.accountNumber);
    } else if (filterType === 'unverified') {
      filtered = filtered.filter(user => !user.bank || !user.accountNumber);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, filterType]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  // Utility functions
  const formatDate = useCallback((dateString) => {
    return dateString ? moment(dateString).tz('Africa/Lagos').format('MMM D, YYYY HH:mm') : 'N/A';
  }, []);

  const calculateAge = useCallback((dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  const generateAvatarUrl = useCallback((avatarSeed) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=B38939,1A202C&textColor=ffffff`;
  }, []);

  const openUserModal = useCallback((user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  }, []);

  const closeUserModal = useCallback(() => {
    setSelectedUser(null);
    setShowUserModal(false);
  }, []);

  // Pagination
  const currentUsers = useMemo(() => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  }, [filteredUsers, currentPage]);

  const totalPages = useMemo(() => Math.ceil(filteredUsers.length / usersPerPage), [filteredUsers]);

  const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

  // Calculate statistics
  const userStats = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    const total = safeUsers.length;
    const admins = safeUsers.filter(u => u?.isAdmin).length;
    const verified = safeUsers.filter(u => u?.bank && u?.accountNumber).length;
    const regular = total - admins;
    const unverified = total - verified;
    
    return { total, admins, verified, regular, unverified };
  }, [users]);

  // Statistics Cards Component
  const StatCard = ({ title, value, icon: Icon, gradient, description }) => (
    <div className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-md group-hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 group-hover:text-[#B38939] transition-colors duration-300">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 w-full overflow-x-hidden font-['Bricolage_Grotesque']">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className={`flex-1 transition-all duration-500 ${isCollapsed ? SIDEBAR_CONFIG.collapsed.margin : SIDEBAR_CONFIG.expanded.margin} p-3 lg:p-6`}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <div className="mb-3 lg:mb-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#B38939] via-[#D4AF37] to-[#B38939] bg-clip-text text-transparent mb-1">
                User Management
              </h1>
              <p className="text-gray-600 flex items-center text-sm">
                <UserGroupIcon className="w-3 h-3 mr-2 text-[#B38939]" />
                Manage and monitor all registered users
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchUsers}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 shadow-md text-sm"
                aria-label="Refresh users"
              >
                <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={userStats.total.toLocaleString()}
              icon={UserGroupIcon}
              description="All registered users"
              gradient="from-[#B38939] to-[#D4AF37]"
            />
            <StatCard
              title="Admins"
              value={userStats.admins.toLocaleString()}
              icon={ShieldCheckIcon}
              description="System administrators"
              gradient="from-purple-500 to-indigo-500"
            />
            <StatCard
              title="Bank Verified"
              value={userStats.verified.toLocaleString()}
              icon={CheckCircleIcon}
              description="Users with bank details"
              gradient="from-emerald-500 to-teal-500"
            />
            <StatCard
              title="Regular Users"
              value={userStats.regular.toLocaleString()}
              icon={UserCircleIcon}
              description="Standard user accounts"
              gradient="from-blue-500 to-cyan-500"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 rounded-r-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="font-semibold text-sm">Error occurred</p>
                  <p className="mt-1 text-xs">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-3 text-red-700 hover:text-red-900 transition-colors duration-200 p-1 hover:bg-red-100 rounded-md"
                  aria-label="Dismiss error"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <FunnelIcon className="w-4 h-4 mr-2 text-[#B38939]" />
                Filter Users
              </h2>
              <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                {filteredUsers.length} of {users.length} users
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or bank..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:shadow-md transition-all duration-200 text-sm bg-gray-50"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:shadow-md transition-all duration-200 text-sm bg-gray-50"
              >
                <option value="all">All Users</option>
                <option value="admin">Administrators</option>
                <option value="regular">Regular Users</option>
                <option value="verified">Bank Verified</option>
                <option value="unverified">Not Verified</option>
              </select>
              
              <div className="flex items-center justify-center text-gray-600 text-sm bg-gradient-to-r from-[#B38939]/10 to-[#D4AF37]/10 rounded-xl p-3 border border-[#B38939]/20">
                <UserGroupIcon className="w-4 h-4 mr-2 text-[#B38939]" />
                Active Filters Applied
              </div>
            </div>
          </div>

          {/* Users Grid/Table */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-[#B38939] mx-auto mb-3"></div>
                  <div className="text-gray-500 text-sm">Loading users...</div>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-[#B38939]/20 to-[#D4AF37]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-8 h-8 text-[#B38939]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4 text-sm">Try adjusting your search criteria or check back later</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-xl hover:shadow-md transition-all duration-200 text-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Bank Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentUsers.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-gradient-to-r hover:from-[#B38939]/5 hover:to-transparent transition-all duration-300 group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <img
                                className="w-8 h-8 rounded-lg shadow-md mr-3 group-hover:scale-105 transition-transform duration-300"
                                src={generateAvatarUrl(user.avatarSeed || `${user.firstName} ${user.lastName}`)}
                                alt={`${user.firstName} ${user.lastName}`}
                              />
                              <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-[#B38939] transition-colors duration-200">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Age: {calculateAge(user.dateOfBirth)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-900">
                                <EnvelopeIcon className="w-3 h-3 mr-2 text-gray-400" />
                                <span className="truncate max-w-[180px]">{user.email}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <PhoneIcon className="w-3 h-3 mr-2 text-gray-400" />
                                {user.phoneNumber || 'No phone'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm font-semibold text-gray-900">
                                <BuildingLibraryIcon className="w-3 h-3 mr-2 text-[#B38939]" />
                                {user.bank || 'Not set'}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {user.accountNumber || 'No account'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {user.isAdmin && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  <ShieldCheckIcon className="w-3 h-3 mr-1" />
                                  Admin
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                user.bank && user.accountNumber 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {user.bank && user.accountNumber ? (
                                  <>
                                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                                    Verified
                                  </>
                                ) : (
                                  <>
                                    <ClockIcon className="w-3 h-3 mr-1" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center text-sm text-gray-900">
                              <CalendarIcon className="w-3 h-3 mr-2 text-gray-400" />
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openUserModal(user)}
                              className="p-1.5 text-[#B38939] hover:text-white hover:bg-[#B38939] rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3 p-4">
                  {currentUsers.map((user) => (
                    <div
                      key={user._id}
                      className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <img
                            className="w-10 h-10 rounded-xl shadow-md mr-3"
                            src={generateAvatarUrl(user.avatarSeed || `${user.firstName} ${user.lastName}`)}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              Age: {calculateAge(user.dateOfBirth)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {user.isAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <ShieldCheckIcon className="w-3 h-3 mr-1" />
                              Admin
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            user.bank && user.accountNumber 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {user.bank && user.accountNumber ? (
                              <>
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <ClockIcon className="w-3 h-3 mr-1" />
                                Pending
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-sm text-gray-700">
                          <EnvelopeIcon className="w-3 h-3 mr-2 text-gray-400" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <PhoneIcon className="w-3 h-3 mr-2 text-gray-400" />
                          {user.phoneNumber || 'No phone provided'}
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Bank Details:</p>
                          <div className="bg-white p-2 rounded-lg border border-gray-200">
                            <div className="flex items-center text-sm font-semibold text-gray-900 mb-1">
                              <BuildingLibraryIcon className="w-3 h-3 mr-2 text-[#B38939]" />
                              {user.bank || 'Not provided'}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {user.accountNumber || 'No account number'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="w-3 h-3 mr-2" />
                          Joined {formatDate(user.createdAt)}
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200">
                        <button
                          onClick={() => openUserModal(user)}
                          className="w-full flex items-center justify-center px-3 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-lg hover:shadow-md transition-all duration-200 text-sm"
                        >
                          <EyeIcon className="w-4 h-4 mr-1.5" />
                          View Full Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{currentUsers.length > 0 ? (currentPage - 1) * usersPerPage + 1 : 0}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> of{' '}
                        <span className="font-medium">{filteredUsers.length}</span> results
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-1.5 text-gray-500 hover:text-[#B38939] hover:bg-[#B38939]/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => paginate(pageNum)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white shadow-md'
                                    : 'text-gray-500 hover:text-[#B38939] hover:bg-[#B38939]/10'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="p-1.5 text-gray-500 hover:text-[#B38939] hover:bg-[#B38939]/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* User Details Modal */}
          {showUserModal && selectedUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
              <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl transition-transform duration-300 transform scale-100">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <img
                        className="w-12 h-12 rounded-xl shadow-md mr-3"
                        src={generateAvatarUrl(selectedUser.avatarSeed || `${selectedUser.firstName} ${selectedUser.lastName}`)}
                        alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </h3>
                        <p className="text-gray-500 text-sm">Complete user profile and details</p>
                      </div>
                    </div>
                    <button
                      onClick={closeUserModal}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                      aria-label="Close modal"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* User Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.isAdmin && (
                      <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-xl border border-purple-200 shadow-md">
                        <ShieldCheckIcon className="w-4 h-4 mr-1.5" />
                        <span className="font-bold text-sm">System Administrator</span>
                      </div>
                    )}
                    <div className={`flex items-center px-3 py-1.5 rounded-xl border shadow-md ${
                      selectedUser.bank && selectedUser.accountNumber 
                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200' 
                        : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200'
                    }`}>
                      {selectedUser.bank && selectedUser.accountNumber ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                          <span className="font-bold text-sm">Bank Verified</span>
                        </>
                      ) : (
                        <>
                          <ClockIcon className="w-4 h-4 mr-1.5" />
                          <span className="font-bold text-sm">Bank Details Pending</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center">
                      <UserCircleIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                        <div className="text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                        <div className="text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                          {selectedUser.dateOfBirth ? formatDate(selectedUser.dateOfBirth) : 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Age</label>
                        <div className="text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                          {calculateAge(selectedUser.dateOfBirth)} years old
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-xl border border-green-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-2 text-green-600" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                        <div className="flex items-center text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                          <EnvelopeIcon className="w-3 h-3 mr-2 text-gray-400" />
                          {selectedUser.email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                        <div className="flex items-center text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                          <PhoneIcon className="w-3 h-3 mr-2 text-gray-400" />
                          {selectedUser.phoneNumber || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banking Information */}
                  <div className="bg-gradient-to-r from-[#B38939]/10 to-[#D4AF37]/10 p-4 rounded-xl border border-[#B38939]/20">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center">
                      <BuildingLibraryIcon className="w-4 h-4 mr-2 text-[#B38939]" />
                      Banking Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
                        <div className="flex items-center text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                          <BuildingLibraryIcon className="w-3 h-3 mr-2 text-[#B38939]" />
                          {selectedUser.bank || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Account Number</label>
                        <div className="flex items-center text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                          <CreditCardIcon className="w-3 h-3 mr-2 text-[#B38939]" />
                          <span className="font-mono">
                            {selectedUser.accountNumber || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="bg-gradient-to-r from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2 text-purple-600" />
                      Account Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Account ID</label>
                        <div className="text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200 font-mono">
                          {selectedUser._id}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Registration Date</label>
                        <div className="text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                          {formatDate(selectedUser.createdAt)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Last Updated</label>
                        <div className="text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                          {formatDate(selectedUser.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paystack Integration */}
                  {selectedUser.paystackCustomerCode && (
                    <div className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl border border-indigo-100">
                      <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center">
                        <CreditCardIcon className="w-4 h-4 mr-2 text-indigo-600" />
                        Payment Integration
                      </h4>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Paystack Customer Code</label>
                        <div className="text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200 font-mono">
                          {selectedUser.paystackCustomerCode}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center">
                      <BanknotesIcon className="w-4 h-4 mr-2 text-gray-600" />
                      Account Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xl font-bold text-[#B38939] mb-1">
                          {selectedUser.isAdmin ? 'Yes' : 'No'}
                        </div>
                        <div className="text-xs text-gray-600">Admin Status</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xl font-bold text-[#B38939] mb-1">
                          {selectedUser.bank && selectedUser.accountNumber ? 'Complete' : 'Incomplete'}
                        </div>
                        <div className="text-xs text-gray-600">Bank Setup</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xl font-bold text-[#B38939] mb-1">Active</div>
                        <div className="text-xs text-gray-600">Account Status</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;