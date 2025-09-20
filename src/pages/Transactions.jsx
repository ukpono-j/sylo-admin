import { useEffect, useState, useMemo, useCallback } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import moment from 'moment-timezone';
import {
  EyeIcon, FunnelIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
  ArrowPathIcon, XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon,
  UserGroupIcon, ShoppingBagIcon, CreditCardIcon, TruckIcon, CalendarIcon,
  BuildingLibraryIcon, ArrowsRightLeftIcon, UsersIcon, TagIcon, BanknotesIcon
} from '@heroicons/react/24/outline';

const SIDEBAR_CONFIG = {
  expanded: { margin: 'lg:ml-[280px]' },
  collapsed: { margin: 'lg:ml-[90px]' }
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/admin/transactions');
      setTransactions(response.data.data.transactions || []);
    } catch (error) {
      setError(error.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = [
        transaction.paymentName, transaction._id, transaction.userId?.firstName,
        transaction.userId?.lastName, transaction.productDetails?.description,
        ...(transaction.participants?.flatMap(p => [p.userId?.firstName, p.userId?.lastName]) || [])
      ].some(field => field?.toLowerCase()?.includes(searchLower));
      
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesUserType = userTypeFilter === 'all' || 
        transaction.selectedUserType === userTypeFilter ||
        transaction.participants?.some(p => p.role === userTypeFilter);
      
      return matchesSearch && matchesStatus && matchesUserType;
    });
  }, [transactions, searchTerm, statusFilter, userTypeFilter]);

  const totalPages = useMemo(() => Math.ceil(filteredTransactions.length / itemsPerPage), [filteredTransactions]);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const transactionStats = useMemo(() => {
    const statusCounts = transactions.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      acc.total++;
      acc.totalAmount += t.paymentAmount || 0;
      return acc;
    }, { total: 0, totalAmount: 0, pending: 0, completed: 0, funded: 0, canceled: 0 });
    return statusCounts;
  }, [transactions]);

  const getStatusColor = useCallback((status) => ({
    completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    funded: 'bg-blue-100 text-blue-800 border border-blue-200',
    canceled: 'bg-red-100 text-red-800 border border-red-200'
  }[status] || 'bg-gray-100 text-gray-800 border border-gray-200'), []);

  const getStatusIcon = useCallback((status) => ({
    completed: CheckCircleIcon, pending: ClockIcon, funded: CreditCardIcon, canceled: XMarkIcon
  }[status] || ExclamationTriangleIcon), []);

  const getUserTypeColor = useCallback((type) => 
    type === 'buyer' ? 'bg-purple-100 text-purple-800 border border-purple-200'
                     : 'bg-orange-100 text-orange-800 border border-orange-200', []);

  const formatDate = useCallback((date) => 
    date ? moment(date).tz('Africa/Lagos').format('MMM D, YYYY HH:mm') : 'N/A', []);

  const getParticipantsDisplay = useCallback((transaction) => {
    const getFullName = (user) => user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Unknown';
    const creator = transaction.userId;
    const creatorRole = transaction.selectedUserType;
    const otherParticipant = transaction.participants?.find(p => p.role !== creatorRole);
    
    const creatorName = getFullName(creator);
    const otherName = getFullName(otherParticipant?.userId);
    
    return {
      buyerName: creatorRole === 'buyer' ? creatorName : otherName,
      sellerName: creatorRole === 'seller' ? creatorName : otherName
    };
  }, []);

  const StatCard = ({ title, value, icon: Icon, gradient }) => (
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
                Transaction Management
              </h1>
              <p className="text-gray-600 text-sm flex items-center">
                <ArrowsRightLeftIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                Monitor and track all platform transactions
              </p>
            </div>
            <button
              onClick={fetchTransactions}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 shadow-md"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Transactions" value={transactionStats.total.toLocaleString()} 
                     icon={ArrowsRightLeftIcon} gradient="from-[#B38939] to-[#D4AF37]" />
            <StatCard title="Pending" value={transactionStats.pending.toLocaleString()} 
                     icon={ClockIcon} gradient="from-amber-500 to-orange-500" />
            <StatCard title="Completed" value={transactionStats.completed.toLocaleString()} 
                     icon={CheckCircleIcon} gradient="from-emerald-500 to-teal-500" />
            <StatCard title="Total Volume" value={`₦${transactionStats.totalAmount.toLocaleString()}`} 
                     icon={BanknotesIcon} gradient="from-blue-500 to-indigo-500" />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 rounded-r-lg shadow-md">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Error: {error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
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
                Filter Transactions
              </h2>
              <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                {filteredTransactions.length} of {transactions.length} transactions
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions, users, products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:shadow-md transition-all duration-200 text-sm bg-gray-50"
                />
              </div>
              
              {['Status', 'User Type'].map((label, idx) => (
                <select
                  key={label}
                  value={idx === 0 ? statusFilter : userTypeFilter}
                  onChange={(e) => idx === 0 ? setStatusFilter(e.target.value) : setUserTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:shadow-md transition-all duration-200 text-sm bg-gray-50"
                >
                  <option value="all">All {label}s</option>
                  {idx === 0 ? ['pending', 'funded', 'completed', 'canceled'].map(s => 
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ) : ['buyer', 'seller'].map(t => 
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}s</option>
                  )}
                </select>
              ))}
              
              <div className="flex items-center justify-center text-gray-600 text-xs bg-gradient-to-r from-[#B38939]/10 to-[#D4AF37]/10 rounded-lg p-2 border border-[#B38939]/20">
                <ArrowsRightLeftIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                Active Filters
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-[#B38939] mx-auto mb-3"></div>
                  <div className="text-gray-500 text-sm">Loading transactions...</div>
                </div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <ArrowsRightLeftIcon className="w-16 h-16 text-[#B38939] mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your search criteria or check back later</p>
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setUserTypeFilter('all'); }}
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
                        {['Participants', 'Type & Amount', 'Product', 'Status', 'Date', 'Actions'].map(header => (
                          <th key={header} className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTransactions.map((transaction) => {
                        const { buyerName, sellerName } = getParticipantsDisplay(transaction);
                        const StatusIcon = getStatusIcon(transaction.status);
                        return (
                          <tr key={transaction._id} className="hover:bg-gradient-to-r hover:from-[#B38939]/5 hover:to-transparent transition-all duration-200">
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {[{name: buyerName, role: 'Buyer', color: 'purple'}, {name: sellerName, role: 'Seller', color: 'orange'}].map(({name, role, color}) => (
                                  <div key={role} className="flex items-center">
                                    <div className={`w-8 h-8 bg-gradient-to-br from-${color}-500 to-${color === 'purple' ? 'blue' : 'red'}-500 rounded-lg flex items-center justify-center shadow-md mr-3`}>
                                      <UsersIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900 hover:text-[#B38939] transition-colors duration-200">{name}</div>
                                      <div className={`text-xs text-${color}-600 font-medium`}>{role}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getUserTypeColor(transaction.selectedUserType)}`}>
                                  <TagIcon className="w-3 h-3 mr-1" />
                                  {transaction.selectedUserType || 'N/A'}
                                </span>
                                <div className="text-base font-semibold text-[#B38939]">
                                  ₦{transaction.paymentAmount?.toLocaleString() || '0'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-md mr-3">
                                  <ShoppingBagIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-xs text-gray-900 max-w-[150px] truncate">
                                  {transaction.productDetails?.description || 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <StatusIcon className="w-4 h-4 mr-1 text-gray-400" />
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                                  {transaction.status?.charAt(0)?.toUpperCase() + transaction.status?.slice(1) || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center text-xs text-gray-900">
                                <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                                {formatDate(transaction.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => { setSelectedTransaction(transaction); setShowModal(true); }}
                                className="p-1.5 text-[#B38939] hover:text-white hover:bg-[#B38939] rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block lg:hidden space-y-3 p-4">
                  {paginatedTransactions.map((transaction) => {
                    const { buyerName, sellerName } = getParticipantsDisplay(transaction);
                    const StatusIcon = getStatusIcon(transaction.status);
                    return (
                      <div key={transaction._id} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-md mr-3">
                              <ArrowsRightLeftIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900">#{transaction._id?.slice(-8) || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <StatusIcon className="w-4 h-4 mr-1 text-gray-400" />
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                              {transaction.status?.charAt(0)?.toUpperCase() + transaction.status?.slice(1) || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          {[
                            {label: 'Amount', value: `₦${transaction.paymentAmount?.toLocaleString() || '0'}`, class: 'text-base font-semibold text-[#B38939]'},
                            {label: 'Type', value: <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getUserTypeColor(transaction.selectedUserType)}`}>
                              <TagIcon className="w-3 h-3 mr-1" />{transaction.selectedUserType || 'N/A'}</span>}
                          ].map(({label, value, class: className}) => (
                            <div key={label} className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-600">{label}:</span>
                              <span className={className || ''}>{value}</span>
                            </div>
                          ))}
                          
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Participants:</p>
                            <div className="bg-white p-2 rounded-lg border border-gray-200 space-y-1">
                              {[{name: buyerName, role: 'Buyer', color: 'purple'}, {name: sellerName, role: 'Seller', color: 'orange'}].map(({name, role, color}) => (
                                <div key={role} className="flex items-center text-xs">
                                  <div className={`w-6 h-6 bg-${color}-100 rounded-lg flex items-center justify-center mr-2`}>
                                    <UsersIcon className={`w-4 h-4 text-${color}-600`} />
                                  </div>
                                  <span className="font-semibold text-gray-900">{name}</span>
                                  <span className={`ml-2 text-xs text-${color}-600 bg-${color}-100 px-1.5 py-0.5 rounded-full`}>{role}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Product:</p>
                            <div className="text-xs text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
                              {transaction.productDetails?.description || 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => { setSelectedTransaction(transaction); setShowModal(true); }}
                          className="w-full flex items-center justify-center px-3 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-lg hover:shadow-md transition-all duration-200"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-700">
                        Showing <span className="font-medium">{paginatedTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of{' '}
                        <span className="font-medium">{filteredTransactions.length}</span> results
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 text-gray-500 hover:text-[#B38939] hover:bg-[#B38939]/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            let pageNum = totalPages <= 5 ? i + 1 : 
                              currentPage <= 3 ? i + 1 : 
                              currentPage >= totalPages - 2 ? totalPages - 4 + i : 
                              currentPage - 2 + i;
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
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
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

          {/* Modal */}
          {showModal && selectedTransaction && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
              <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-lg">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-md mr-3">
                      <ArrowsRightLeftIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                      <p className="text-gray-500 text-xs">Complete transaction information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-center">
                    {(() => {
                      const StatusIcon = getStatusIcon(selectedTransaction.status);
                      return (
                        <div className={`flex items-center px-4 py-2 rounded-lg shadow-md ${getStatusColor(selectedTransaction.status)}`}>
                          <StatusIcon className="w-5 h-5 mr-2" />
                          <span className="text-base font-semibold">
                            {selectedTransaction.status?.charAt(0)?.toUpperCase() + selectedTransaction.status?.slice(1) || 'Unknown'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Basic Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <CreditCardIcon className="w-4 h-4 mr-1 text-blue-600" />
                      Transaction Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {label: 'Transaction ID', value: selectedTransaction._id || 'N/A', mono: true},
                        {label: 'Initiator Type', value: <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getUserTypeColor(selectedTransaction.selectedUserType)}`}>
                          <TagIcon className="w-3 h-3 mr-1" />{selectedTransaction.selectedUserType || 'N/A'}</span>},
                        {label: 'Payment Amount', value: `₦${selectedTransaction.paymentAmount?.toLocaleString() || '0'}`, class: 'text-lg font-semibold text-[#B38939]'}
                      ].map(({label, value, mono, class: className}) => (
                        <div key={label}>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                          <div className={`text-xs text-gray-900 bg-white p-2 rounded-lg border border-gray-200 ${mono ? 'font-mono' : ''} ${className || ''}`}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-lg border border-green-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <UserGroupIcon className="w-4 h-4 mr-1 text-green-600" />
                      Transaction Participants
                    </h4>
                    <div className="space-y-3">
                      {selectedTransaction.participants?.length > 0 ? (
                        selectedTransaction.participants.map((participant, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md mr-3 ${
                                participant.role === 'buyer' ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-gradient-to-br from-orange-500 to-red-500'
                              }`}>
                                <UsersIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {participant.userId?.firstName ? `${participant.userId.firstName} ${participant.userId.lastName || ''}`.trim() : 'Unknown User'}
                                </div>
                                <div className="text-xs text-gray-500">{participant.userId?.email || 'No email available'}</div>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getUserTypeColor(participant.role)}`}>
                              <TagIcon className="w-3 h-3 mr-1" />
                              {participant.role?.charAt(0)?.toUpperCase() + participant.role?.slice(1) || 'N/A'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500 text-sm">
                          <UsersIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No participant details available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product */}
                  <div className="bg-gradient-to-r from-[#B38939]/10 to-[#D4AF37]/10 p-4 rounded-lg border border-[#B38939]/20">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <ShoppingBagIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                      Product Details
                    </h4>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                      <div className="text-xs text-gray-900">{selectedTransaction.productDetails?.description || 'No product description available'}</div>
                    </div>
                  </div>

                  {/* Payment Details (sellers only) */}
                  {selectedTransaction.selectedUserType === 'seller' && (
                    <div className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-lg border border-indigo-100">
                      <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                        <BuildingLibraryIcon className="w-4 h-4 mr-1 text-indigo-600" />
                        Payment Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          {label: 'Bank Name', value: selectedTransaction.paymentBank || 'Pending'},
                          {label: 'Account Number', value: selectedTransaction.paymentAccountNumber || 'N/A', mono: true},
                          {label: 'Bank Code', value: selectedTransaction.paymentBankCode || 'N/A', mono: true}
                        ].map(({label, value, mono}) => (
                          <div key={label}>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                            <div className={`text-xs text-gray-900 bg-white p-2 rounded-lg border border-gray-200 ${mono ? 'font-mono' : ''}`}>
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="bg-gradient-to-r from-purple-50 to-white p-4 rounded-lg border border-purple-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1 text-purple-600" />
                      Transaction Progress
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        {label: 'Funded', status: selectedTransaction.funded},
                        {label: 'Buyer Confirmed', status: selectedTransaction.buyerConfirmed},
                        {label: 'Seller Confirmed', status: selectedTransaction.sellerConfirmed},
                        {label: 'Payout Released', status: selectedTransaction.payoutReleased}
                      ].map(({label, status}) => (
                        <div key={label} className="flex items-center justify-center p-3 bg-white rounded-lg border border-gray-200">
                          <div className={`w-3 h-3 rounded-full mr-2 ${status ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                          <span className="text-xs font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Waybill */}
                  {selectedTransaction.waybillDetails && (
                    <div className="bg-gradient-to-r from-orange-50 to-white p-4 rounded-lg border border-orange-100">
                      <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                        <TruckIcon className="w-4 h-4 mr-1 text-orange-600" />
                        Shipping & Waybill Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {label: 'Item Description', value: selectedTransaction.waybillDetails.item || 'N/A'},
                          {label: 'Tracking Number', value: selectedTransaction.waybillDetails.trackingNumber || 'N/A', mono: true},
                          {label: 'Shipping Address', value: selectedTransaction.waybillDetails.shippingAddress || 'N/A', span: 2},
                          {label: 'Delivery Date', value: formatDate(selectedTransaction.waybillDetails?.deliveryDate)}
                        ].map(({label, value, mono, span}) => (
                          <div key={label} className={span === 2 ? 'md:col-span-2' : ''}>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                            <div className={`text-xs text-gray-900 bg-white p-2 rounded-lg border border-gray-200 ${mono ? 'font-mono' : ''}`}>
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1 text-gray-600" />
                      Transaction Timeline
                    </h4>
                    <div className="space-y-2">
                      {[
                        {label: 'Created Date', value: formatDate(selectedTransaction.createdAt)},
                        {label: 'Last Updated', value: formatDate(selectedTransaction.updatedAt)}
                      ].map(({label, value}) => (
                        <div key={label} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-xs font-medium text-gray-700">{label}</span>
                          <span className="text-xs text-gray-900">{value}</span>
                        </div>
                      ))}
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

export default Transactions;