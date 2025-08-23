import { useEffect, useState, useMemo, useCallback } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import { 
  EyeIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import moment from 'moment-timezone';

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
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get('/api/admin/transactions');
        const transactions = response.data.data.transactions || [];
        setTransactions(transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError(error.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.paymentName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        transaction._id?.toString()?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        transaction.userId?.firstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        transaction.userId?.lastName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        transaction.participants?.some(p => 
          p.userId?.firstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
          p.userId?.lastName?.toLowerCase()?.includes(searchTerm.toLowerCase())
        );
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

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'funded': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'canceled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }, []);

  const getUserTypeColor = useCallback((type) => {
    return type === 'buyer' 
      ? 'bg-purple-100 text-purple-800 border border-purple-200'
      : 'bg-orange-100 text-orange-800 border border-orange-200';
  }, []);

  const viewTransactionDetails = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  }, []);

  const formatDate = useCallback((date) => {
    return date ? moment(date).tz('Africa/Lagos').format('MMM D, YYYY HH:mm') : 'N/A';
  }, []);

  const getParticipantsDisplay = useCallback((transaction) => {
    const getFullName = (user) => {
      if (!user || !user.firstName) return 'Unknown';
      return `${user.firstName} ${user.lastName || ''}`.trim();
    };

    const creator = transaction.userId;
    const creatorRole = transaction.selectedUserType;
    const otherParticipant = transaction.participants?.find(p => p.role !== creatorRole);
    
    const creatorName = getFullName(creator);
    const otherName = getFullName(otherParticipant?.userId);
    
    const buyerName = creatorRole === 'buyer' ? creatorName : otherName;
    const sellerName = creatorRole === 'seller' ? creatorName : otherName;

    return { buyerName, sellerName };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 font-['Bricolage_Grotesque']">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-200 transition-margin duration-300 pt-16 lg:pt-8 ${isCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[250px]'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#1A202C] tracking-tight mb-4 sm:mb-0">
              Transactions
            </h2>
            <button 
              onClick={() => fetchTransactions()}
              className="flex items-center px-4 py-2.5 bg-[#B38939] text-white rounded-lg hover:bg-[#BB954D] transition-colors duration-200 hover:scale-[1.03] shadow-sm hover:shadow-md"
              aria-label="Refresh transactions"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center shadow-sm transition-opacity duration-300">
              <span><strong>Error:</strong> {error}</span>
              <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 transition-colors duration-200 p-2" aria-label="Dismiss error">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:ring-2 hover:ring-[#B38939]/50 transition-colors duration-200 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:ring-2 hover:ring-[#B38939]/50 transition-colors duration-200 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="funded">Funded</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:ring-2 hover:ring-[#B38939]/50 transition-colors duration-200 text-sm"
              >
                <option value="all">All User Types</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
              </select>
              <div className="flex items-center text-gray-600 text-sm">
                <FunnelIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                {filteredTransactions.length} of {transactions.length} transactions
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#B38939] mx-auto mb-4"></div>
                  <div className="text-gray-500 text-base sm:text-lg">Loading transactions...</div>
                </div>
              </div>
            ) : paginatedTransactions.length > 0 ? (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Participants</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTransactions.map((transaction) => {
                        const { buyerName, sellerName } = getParticipantsDisplay(transaction);
                        return (
                          <tr key={transaction._id} className="hover:bg-[#BB954D]/10 transition-colors duration-200">
                            <td className="px-6 py-4">
                              <div className="flex flex-col space-y-1 text-[#1A202C] font-medium max-w-[280px] lg:max-w-[320px] line-clamp-2" title={`${buyerName} (Buyer)\n${sellerName} (Seller)`}>
                                <span>{buyerName} <span className="text-gray-500 font-normal">(Buyer)</span></span>
                                <span>{sellerName} <span className="text-gray-500 font-normal">(Seller)</span></span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(transaction.selectedUserType)}`}>
                                {transaction.selectedUserType || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[#B38939] font-medium text-sm">
                              ₦{transaction.paymentAmount?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {transaction.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-[#1A202C] text-sm max-w-[160px] lg:max-w-[200px] line-clamp-2">
                                {transaction.productDetails?.description || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[#1A202C] text-sm">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => viewTransactionDetails(transaction)}
                                className="text-[#B38939] hover:text-[#BB954D] transition-colors duration-200 hover:scale-[1.03] p-2"
                                aria-label="View transaction details"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="block lg:hidden space-y-4 p-4">
                  {paginatedTransactions.map((transaction) => {
                    const { buyerName, sellerName } = getParticipantsDisplay(transaction);
                    return (
                      <div key={transaction._id} className="bg-gray-50 p-4 rounded-lg shadow-sm transition-colors duration-200 hover:bg-[#BB954D]/10">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-[#1A202C] font-medium max-w-[220px] sm:max-w-[280px] line-clamp-2 text-sm" title={`${buyerName} (Buyer)\n${sellerName} (Seller)`}>
                              <div>{buyerName} <span className="text-gray-500 font-normal">(Buyer)</span></div>
                              <div>{sellerName} <span className="text-gray-500 font-normal">(Seller)</span></div>
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              Type: <span className={`px-2 py-1 rounded-full font-medium ${getUserTypeColor(transaction.selectedUserType)}`}>
                                {transaction.selectedUserType || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {transaction.status || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium text-gray-600">Amount:</span> ₦{transaction.paymentAmount?.toLocaleString() || '0'}</div>
                          <div><span className="font-medium text-gray-600">Product:</span> {transaction.productDetails?.description || 'N/A'}</div>
                          <div><span className="font-medium text-gray-600">Date:</span> {formatDate(transaction.createdAt)}</div>
                        </div>
                        <button
                          onClick={() => viewTransactionDetails(transaction)}
                          className="mt-3 w-full flex justify-center text-[#B38939] hover:text-[#BB954D] transition-colors duration-200 hover:scale-[1.03] p-2"
                          aria-label="View transaction details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
                    <div className="text-sm text-gray-700">
                      Showing {paginatedTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-[#B38939]/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Previous page"
                      >
                        <ChevronLeftIcon className="w-6 h-6" />
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-[#B38939]/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Next page"
                      >
                        <ChevronRightIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-base sm:text-lg mb-2">No transactions found</div>
                <div className="text-gray-400 text-sm">Try adjusting your search criteria</div>
              </div>
            )}
          </div>
        </div>

        {showModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-xl w-full max-w-[90vw] sm:max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto shadow-xl transition-transform duration-300 transform scale-100">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#1A202C]">Transaction Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded truncate">{selectedTransaction._id || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Initiator Type</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(selectedTransaction.selectedUserType)}`}>
                        {selectedTransaction.selectedUserType || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                      <div className="text-sm text-[#B38939] font-medium">₦{selectedTransaction.paymentAmount?.toLocaleString() || '0'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Participants</h4>
                    <div className="space-y-4">
                      {selectedTransaction.participants?.length > 0 ? (
                        selectedTransaction.participants.map((participant, index) => (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(participant.role)}`}>
                                {participant.role || 'N/A'}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <div className="text-sm text-gray-900 truncate max-w-[220px] sm:max-w-[280px]">
                                {participant.userId?.firstName ? 
                                  `${participant.userId.firstName} ${participant.userId.lastName || ''}`.trim() : 
                                  'Unknown'}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No participant details available</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded line-clamp-3">{selectedTransaction.productDetails?.description || 'N/A'}</div>
                  </div>
                  {selectedTransaction.selectedUserType === 'seller' && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-sm">Payment Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                          <div className="text-sm text-gray-900">{selectedTransaction.paymentBank || 'Pending'}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                          <div className="text-sm text-gray-900">{selectedTransaction.paymentAccountNumber || '0'}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Code</label>
                          <div className="text-sm text-gray-900">{selectedTransaction.paymentBankCode || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Transaction Status</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${selectedTransaction.funded ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm">Funded</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${selectedTransaction.buyerConfirmed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm">Buyer Confirmed</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${selectedTransaction.sellerConfirmed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm">Seller Confirmed</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${selectedTransaction.payoutReleased ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm">Payout Released</span>
                      </div>
                    </div>
                  </div>
                  {selectedTransaction.waybillDetails && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-sm">Waybill Details</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Item</label>
                          <div className="text-sm text-gray-900">{selectedTransaction.waybillDetails.item || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                          <div className="text-sm text-gray-900">{selectedTransaction.waybillDetails.trackingNumber || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
                          <div className="text-sm text-gray-900 line-clamp-2">{selectedTransaction.waybillDetails.shippingAddress || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                          <div className="text-sm text-gray-900">{formatDate(selectedTransaction.waybillDetails?.deliveryDate)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                    <div className="text-sm text-gray-900">{formatDate(selectedTransaction.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;