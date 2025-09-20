import { useEffect, useState, useMemo, useCallback } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import moment from 'moment-timezone';
import {
  BanknotesIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const SIDEBAR_CONFIG = {
  expanded: { margin: 'lg:ml-[280px]' },
  collapsed: { margin: 'lg:ml-[90px]' }
};

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/withdrawals');
      setWithdrawals(response.data.data || []);
    } catch (error) {
      setError(error.message || 'Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const handleMarkAsPaid = useCallback(async (reference) => {
    try {
      setProcessing(prev => ({ ...prev, [reference]: true }));
      const response = await axiosInstance.post(`/api/admin/withdrawals/${reference}/paid`);
      setWithdrawals(prev =>
        prev.map(w =>
          w.reference === reference ? { ...w, status: 'paid', metadata: { ...w.metadata, paidDate: response.data.data.paidDate } } : w
        )
      );
      setError(null);
      setShowModal(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to mark withdrawal as paid');
    } finally {
      setProcessing(prev => ({ ...prev, [reference]: false }));
    }
  }, []);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((withdrawal) => {
      const matchesSearch = 
        withdrawal.userName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        withdrawal.userEmail?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        withdrawal.reference?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        withdrawal.metadata?.bankName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        withdrawal.metadata?.accountName?.toLowerCase()?.includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [withdrawals, searchTerm, statusFilter]);

  const withdrawalStats = useMemo(() => {
    const total = withdrawals.length;
    const pending = withdrawals.filter(w => w.status === 'pending').length;
    const paid = withdrawals.filter(w => w.status === 'paid').length;
    const failed = withdrawals.filter(w => w.status === 'failed').length;
    const totalAmount = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const pendingAmount = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0);
    
    return { total, pending, paid, failed, totalAmount, pendingAmount };
  }, [withdrawals]);

  const getStatusColor = useCallback((status) => ({
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    failed: 'bg-red-100 text-red-800 border border-red-200',
    default: 'bg-gray-100 text-gray-800 border border-gray-200'
  }[status] || 'bg-gray-100 text-gray-800 border border-gray-200'), []);

  const getStatusIcon = useCallback((status) => ({
    pending: ClockIcon,
    paid: CheckCircleIcon,
    failed: XMarkIcon,
    default: ExclamationTriangleIcon
  }[status] || ExclamationTriangleIcon), []);

  const formatDate = useCallback((date) => 
    date ? moment(date).tz('Africa/Lagos').format('MMM D, YYYY HH:mm') : 'N/A', []);

  const viewWithdrawalDetails = useCallback((withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowModal(true);
  }, []);

  const StatCard = ({ title, value, icon: Icon, gradient, description }) => (
    <div className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-md group-hover:scale-105 transition-transform duration-200`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
          <p className="text-xl font-bold text-gray-900 group-hover:text-[#B38939] transition-colors duration-200">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden font-['Bricolage_Grotesque']">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? SIDEBAR_CONFIG.collapsed.margin : SIDEBAR_CONFIG.expanded.margin} p-3 lg:p-6`}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-3 lg:mb-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#B38939] via-[#D4AF37] to-[#B38939] bg-clip-text text-transparent mb-1">
                Withdrawal Management
              </h1>
              <p className="text-gray-600 text-sm flex items-center">
                <BanknotesIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                Process and track withdrawal requests
              </p>
            </div>
            <button
              onClick={fetchWithdrawals}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 shadow-md"
              aria-label="Refresh withdrawals"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Requests"
              value={withdrawalStats.total.toLocaleString()}
              icon={CurrencyDollarIcon}
              description="All withdrawal requests"
              gradient="from-[#B38939] to-[#D4AF37]"
            />
            <StatCard
              title="Pending"
              value={withdrawalStats.pending.toLocaleString()}
              icon={ClockIcon}
              description="Awaiting processing"
              gradient="from-amber-500 to-orange-500"
            />
            <StatCard
              title="Completed"
              value={withdrawalStats.paid.toLocaleString()}
              icon={CheckCircleIcon}
              description="Successfully processed"
              gradient="from-emerald-500 to-teal-500"
            />
            <StatCard
              title="Total Amount"
              value={`₦${withdrawalStats.totalAmount.toLocaleString()}`}
              icon={BanknotesIcon}
              description="Combined withdrawal value"
              gradient="from-blue-500 to-indigo-500"
            />
          </div>

          {/* Pending Amount Alert */}
          {withdrawalStats.pendingAmount > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 p-3 rounded-r-lg shadow-md">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 mr-2" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">Pending Withdrawals</h3>
                  <p className="text-xs">
                    <span className="font-bold">₦{withdrawalStats.pendingAmount.toLocaleString()}</span> in {withdrawalStats.pending} pending requests require attention.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 rounded-r-lg shadow-md">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Error: {error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-700 hover:text-red-900 p-1 hover:bg-red-100 rounded-lg transition-all duration-200"
                  aria-label="Dismiss error"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <FunnelIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                Filter Withdrawals
              </h2>
              <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                {filteredWithdrawals.length} of {withdrawals.length} withdrawals
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by user, email, bank, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:shadow-md transition-all duration-200 text-sm bg-gray-50"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:shadow-md transition-all duration-200 text-sm bg-gray-50"
              >
                <option value="all">All Statuses</option>
                {['pending', 'paid', 'failed'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <div className="flex items-center justify-center text-gray-600 text-xs bg-gradient-to-r from-[#B38939]/10 to-[#D4AF37]/10 rounded-lg p-2 border border-[#B38939]/20">
                <UserGroupIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                Active Filters
              </div>
            </div>
          </div>

          {/* Withdrawals List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-[#B38939] mx-auto mb-3"></div>
                  <div className="text-gray-500 text-sm">Loading withdrawals...</div>
                </div>
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12">
                <BanknotesIcon className="w-16 h-16 text-[#B38939] mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No withdrawals found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your search criteria or check back later</p>
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="px-4 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-lg hover:shadow-md transition-all duration-200"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        {['User', 'Amount', 'Bank Details', 'Status', 'Request Date', 'Actions'].map(header => (
                          <th key={header} className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredWithdrawals.map((withdrawal) => {
                        const StatusIcon = getStatusIcon(withdrawal.status);
                        return (
                          <tr key={withdrawal.reference} className="hover:bg-gradient-to-r hover:from-[#B38939]/5 hover:to-transparent transition-all duration-200">
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-md mr-3">
                                  <UserGroupIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 hover:text-[#B38939] transition-colors duration-200">
                                    {withdrawal.userName || 'Unknown User'}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                    {withdrawal.userEmail || 'No email'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-base font-semibold text-[#B38939]">
                                ₦{withdrawal.amount?.toLocaleString() || '0'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center text-sm font-semibold text-gray-900">
                                  <BuildingLibraryIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                                  {withdrawal.metadata?.bankName || 'Unknown Bank'}
                                </div>
                                <div className="text-xs text-gray-700">
                                  {withdrawal.metadata?.accountName || 'Unknown Account'}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  {withdrawal.metadata?.accountNumber || 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <StatusIcon className="w-4 h-4 mr-1 text-gray-400" />
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                                  {withdrawal.status?.charAt(0)?.toUpperCase() + withdrawal.status?.slice(1) || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center text-xs text-gray-900">
                                <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                                {formatDate(withdrawal.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => viewWithdrawalDetails(withdrawal)}
                                  className="p-1.5 text-[#B38939] hover:text-white hover:bg-[#B38939] rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
                                  title="View Details"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                                {withdrawal.status === 'pending' && (
                                  <button
                                    onClick={() => handleMarkAsPaid(withdrawal.reference)}
                                    disabled={processing[withdrawal.reference]}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                      processing[withdrawal.reference]
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-md hover:scale-105'
                                    }`}
                                  >
                                    {processing[withdrawal.reference] ? 'Processing...' : 'Mark as Paid'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block lg:hidden space-y-3 p-4">
                  {filteredWithdrawals.map((withdrawal) => {
                    const StatusIcon = getStatusIcon(withdrawal.status);
                    return (
                      <div key={withdrawal.reference} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-md mr-3">
                              <UserGroupIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900">#{withdrawal.reference?.slice(-8) || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{formatDate(withdrawal.createdAt)}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <StatusIcon className="w-4 h-4 mr-1 text-gray-400" />
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                              {withdrawal.status?.charAt(0)?.toUpperCase() + withdrawal.status?.slice(1) || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">Amount:</span>
                            <span className="text-base font-semibold text-[#B38939]">
                              ₦{withdrawal.amount?.toLocaleString() || '0'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Bank Details:</p>
                            <div className="bg-white p-2 rounded-lg border border-gray-200">
                              <div className="flex items-center text-xs font-semibold text-gray-900 mb-1">
                                <BuildingLibraryIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                                {withdrawal.metadata?.bankName || 'Unknown Bank'}
                              </div>
                              <div className="text-xs text-gray-700 mb-1">
                                {withdrawal.metadata?.accountName || 'Unknown Account'}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {withdrawal.metadata?.accountNumber || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => viewWithdrawalDetails(withdrawal)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-lg hover:shadow-md transition-all duration-200"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View Details
                          </button>
                          {withdrawal.status === 'pending' && (
                            <button
                              onClick={() => handleMarkAsPaid(withdrawal.reference)}
                              disabled={processing[withdrawal.reference]}
                              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                                processing[withdrawal.reference]
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-md'
                              }`}
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              {processing[withdrawal.reference] ? 'Processing...' : 'Mark as Paid'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Modal */}
          {showModal && selectedWithdrawal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-lg">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-md mr-3">
                      <BanknotesIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Withdrawal Details</h3>
                      <p className="text-gray-500 text-xs">Review and process withdrawal request</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-center">
                    {(() => {
                      const StatusIcon = getStatusIcon(selectedWithdrawal.status);
                      return (
                        <div className={`flex items-center px-4 py-2 rounded-lg shadow-md ${getStatusColor(selectedWithdrawal.status)}`}>
                          <StatusIcon className="w-5 h-5 mr-2" />
                          <span className="text-base font-semibold">
                            {selectedWithdrawal.status?.charAt(0)?.toUpperCase() + selectedWithdrawal.status?.slice(1) || 'Unknown'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* User Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <UserGroupIcon className="w-4 h-4 mr-1 text-blue-600" />
                      User Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name', value: selectedWithdrawal.userName || 'Unknown User' },
                        { label: 'Email Address', value: selectedWithdrawal.userEmail || 'No email provided' },
                        { label: 'Reference Number', value: selectedWithdrawal.reference || 'N/A', mono: true }
                      ].map(({ label, value, mono }) => (
                        <div key={label}>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                          <div className={`text-xs text-gray-900 bg-white p-2 rounded-lg border border-gray-200 ${mono ? 'font-mono' : ''}`}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="bg-gradient-to-r from-[#B38939]/10 to-[#D4AF37]/10 p-4 rounded-lg border border-[#B38939]/20">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                      Amount Details
                    </h4>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#B38939] mb-1">
                        ₦{selectedWithdrawal.amount?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-600">Requested withdrawal amount</div>
                    </div>
                  </div>

                  {/* Bank Info */}
                  <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-lg border border-green-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <BuildingLibraryIcon className="w-4 h-4 mr-1 text-green-600" />
                      Bank Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Bank Name', value: selectedWithdrawal.metadata?.bankName || 'Unknown Bank' },
                        { label: 'Account Name', value: selectedWithdrawal.metadata?.accountName || 'Unknown Account' },
                        { label: 'Account Number', value: selectedWithdrawal.metadata?.accountNumber || 'N/A', mono: true }
                      ].map(({ label, value, mono }) => (
                        <div key={label}>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                          <div className={`text-xs text-gray-900 bg-white p-2 rounded-lg border border-gray-200 ${mono ? 'font-mono' : ''}`}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-gradient-to-r from-purple-50 to-white p-4 rounded-lg border border-purple-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1 text-purple-600" />
                      Timeline
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Request Date', value: formatDate(selectedWithdrawal.createdAt) },
                        ...(selectedWithdrawal.metadata?.paidDate ? [{ label: 'Payment Date', value: formatDate(selectedWithdrawal.metadata.paidDate) }] : [])
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                          <div className="text-xs text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedWithdrawal.status === 'pending' && (
                    <div className="bg-gradient-to-r from-emerald-50 to-white p-4 rounded-lg border border-emerald-100">
                      <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1 text-emerald-600" />
                        Process Withdrawal
                      </h4>
                      <p className="text-gray-600 text-xs mb-3">
                        Confirm transfer of ₦{selectedWithdrawal.amount?.toLocaleString()} to the user's bank account.
                      </p>
                      <button
                        onClick={() => handleMarkAsPaid(selectedWithdrawal.reference)}
                        disabled={processing[selectedWithdrawal.reference]}
                        className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          processing[selectedWithdrawal.reference]
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-md hover:scale-105'
                        }`}
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {processing[selectedWithdrawal.reference] ? 'Processing...' : 'Mark as Paid'}
                      </button>
                    </div>
                  )}

                  {selectedWithdrawal.status === 'paid' && (
                    <div className="bg-gradient-to-r from-emerald-50 to-white p-4 rounded-lg border border-emerald-100">
                      <div className="flex items-center justify-center text-emerald-600 mb-3">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        <span className="text-base font-semibold">Payment Completed</span>
                      </div>
                      <p className="text-center text-gray-600 text-xs">
                        Processed{selectedWithdrawal.metadata?.paidDate && ` on ${formatDate(selectedWithdrawal.metadata.paidDate)}`}
                      </p>
                    </div>
                  )}

                  {selectedWithdrawal.status === 'failed' && (
                    <div className="bg-gradient-to-r from-red-50 to-white p-4 rounded-lg border border-red-100">
                      <div className="flex items-center justify-center text-red-600 mb-3">
                        <XMarkIcon className="w-5 h-5 mr-2" />
                        <span className="text-base font-semibold">Payment Failed</span>
                      </div>
                      <p className="text-center text-gray-600 text-xs">This withdrawal request could not be processed</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Withdrawals;