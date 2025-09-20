import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import {
  EyeIcon, FunnelIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
  ArrowPathIcon, XMarkIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon,
  ClockIcon, CheckCircleIcon, UserGroupIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';
import moment from 'moment-timezone';
import io from 'socket.io-client';

const SIDEBAR_CONFIG = {
  expanded: { margin: 'lg:ml-[280px]' },
  collapsed: { margin: 'lg:ml-[90px]' }
};

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const socketRef = useRef(null);

  const fetchMessages = useCallback(async (disputeId) => {
    try {
      const response = await axiosInstance.get(`/api/disputes/${disputeId}`);
      setMessages(response.data.data.messages || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch messages');
    }
  }, []);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      auth: { token: localStorage.getItem('adminToken') },
    });

    socketRef.current.on('connect', () => console.log('Socket connected for admin disputes'));
    socketRef.current.on('disputeMessage', (message) => {
      if (message.disputeId === selectedDispute?._id) {
        setMessages((prev) => {
          const existingMessage = prev.find(msg => msg._id === message._id);
          if (existingMessage) return prev;
          return [...prev, {
            _id: message._id, disputeId: message.disputeId, userId: message.userId,
            userRole: message.userRole, message: message.message, timestamp: message.timestamp
          }];
        });
      }
    });
    socketRef.current.on('connect_error', (err) => setError('Failed to connect to chat server'));

    return () => socketRef.current.disconnect();
  }, [selectedDispute]);

  useEffect(() => {
    if (showChatModal && selectedDispute) {
      socketRef.current.emit('join-dispute-room', selectedDispute._id, localStorage.getItem('adminToken'));
      fetchMessages(selectedDispute._id);
    }
  }, [showChatModal, selectedDispute, fetchMessages]);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/disputes/admin/all');
      setDisputes(response.data.data.disputes || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedDispute) return;
    try {
      const response = await axiosInstance.post(`/api/disputes/${selectedDispute._id}/messages`, { message: newMessage });
      const messageData = response.data.data;
      setMessages((prev) => [...prev, {
        _id: messageData._id, disputeId: messageData.disputeId, userId: messageData.userId,
        userRole: messageData.userRole, message: messageData.message, timestamp: messageData.timestamp
      }]);
      setNewMessage('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send message');
    }
  }, [newMessage, selectedDispute]);

  const handleResolveDispute = useCallback(async (disputeId, resolution) => {
    try {
      await axiosInstance.put(`/api/disputes/admin/${disputeId}/status`, { status: 'Resolved', resolution });
      setDisputes((prev) => prev.map((d) => (d._id === disputeId ? { ...d, status: 'Resolved', resolution } : d)));
      setShowModal(false);
      socketRef.current.emit('disputeStatusUpdate', { disputeId, status: 'Resolved' });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to resolve dispute');
    }
  }, []);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      const transaction = dispute.transactionId;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = [
        transaction?.reference, dispute._id, transaction?.userId?.firstName,
        transaction?.userId?.lastName,
        ...(transaction?.participants?.flatMap(p => [p.userId?.firstName, p.userId?.lastName]) || [])
      ].some(field => field?.toLowerCase()?.includes(searchLower));
      const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [disputes, searchTerm, statusFilter]);

  const totalPages = useMemo(() => Math.ceil(filteredDisputes.length / itemsPerPage), [filteredDisputes]);
  const paginatedDisputes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDisputes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDisputes, currentPage]);

  const disputeStats = useMemo(() => {
    return disputes.reduce((acc, d) => {
      acc[d.status?.toLowerCase() || 'unknown'] = (acc[d.status?.toLowerCase() || 'unknown'] || 0) + 1;
      acc.total++;
      return acc;
    }, { total: 0, open: 0, resolved: 0, cancelled: 0 });
  }, [disputes]);

  const getStatusColor = useCallback((status) => ({
    Open: 'bg-amber-100 text-amber-800 border border-amber-200',
    Resolved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    Cancelled: 'bg-red-100 text-red-800 border border-red-200'
  }[status] || 'bg-gray-100 text-gray-800 border border-gray-200'), []);

  const getStatusIcon = useCallback((status) => ({
    Open: ExclamationTriangleIcon, Resolved: CheckCircleIcon, Cancelled: XMarkIcon
  }[status] || ClockIcon), []);

  const formatDate = useCallback((date) => 
    date ? moment(date).tz('Africa/Lagos').format('MMM D, YYYY HH:mm') : 'N/A', []);

  const getParticipantsDisplay = useCallback((transaction) => {
    const getFullName = (user) => user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Unknown';
    const creator = transaction?.userId;
    const creatorRole = transaction?.selectedUserType;
    const otherParticipant = transaction?.participants?.find((p) => p.role !== creatorRole);
    const creatorName = getFullName(creator);
    const otherName = getFullName(otherParticipant?.userId);
    return {
      buyerName: creatorRole === 'buyer' ? creatorName : otherName,
      sellerName: creatorRole === 'seller' ? creatorName : otherName
    };
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
                Dispute Management
              </h1>
              <p className="text-gray-600 text-sm flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                Monitor and resolve transaction disputes
              </p>
            </div>
            <button
              onClick={fetchDisputes}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 shadow-md"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Disputes" value={disputeStats.total.toLocaleString()} 
                     icon={DocumentTextIcon} description="All dispute records" gradient="from-[#B38939] to-[#D4AF37]" />
            <StatCard title="Open Disputes" value={disputeStats.open.toLocaleString()} 
                     icon={ExclamationTriangleIcon} description="Requiring attention" gradient="from-amber-500 to-orange-500" />
            <StatCard title="Resolved" value={disputeStats.resolved.toLocaleString()} 
                     icon={CheckCircleIcon} description="Successfully resolved" gradient="from-emerald-500 to-teal-500" />
            <StatCard title="Cancelled" value={disputeStats.cancelled.toLocaleString()} 
                     icon={XMarkIcon} description="Cancelled disputes" gradient="from-red-500 to-pink-500" />
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
                Filter Disputes
              </h2>
              <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                {filteredDisputes.length} of {disputes.length} disputes
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search disputes, transactions, participants..."
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
                {['Open', 'Resolved', 'Cancelled'].map(status => 
                  <option key={status} value={status}>{status} Disputes</option>
                )}
              </select>
              
              <div className="flex items-center justify-center text-gray-600 text-xs bg-gradient-to-r from-[#B38939]/10 to-[#D4AF37]/10 rounded-lg p-2 border border-[#B38939]/20">
                <UserGroupIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                Active Filters
              </div>
            </div>
          </div>

          {/* Disputes Table */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-[#B38939] mx-auto mb-3"></div>
                  <div className="text-gray-500 text-sm">Loading disputes...</div>
                </div>
              </div>
            ) : paginatedDisputes.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        {['Transaction', 'Participants', 'Status', 'Reason', 'Date Created', 'Actions'].map(header => (
                          <th key={header} className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedDisputes.map((dispute) => {
                        const { buyerName, sellerName } = getParticipantsDisplay(dispute.transactionId);
                        const StatusIcon = getStatusIcon(dispute.status);
                        return (
                          <tr key={dispute._id} className="hover:bg-gradient-to-r hover:from-[#B38939]/5 hover:to-transparent transition-all duration-200">
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-md mr-3">
                                  <DocumentTextIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 hover:text-[#B38939] transition-colors duration-200">
                                    {dispute.transactionId?.reference || 'No Reference'}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-[100px]">
                                    ID: {dispute._id?.slice(-8) || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {[{name: buyerName, role: 'Buyer', color: 'purple'}, {name: sellerName, role: 'Seller', color: 'orange'}].map(({name, role, color}) => (
                                  <div key={role} className="flex items-center text-xs">
                                    <div className={`w-2 h-2 bg-${color}-500 rounded-full mr-2`}></div>
                                    <span className="font-medium text-gray-900">{name}</span>
                                    <span className={`ml-1 text-xs text-${color}-600 bg-${color}-100 px-1.5 py-0.5 rounded-full`}>{role}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <StatusIcon className="w-4 h-4 mr-1 text-gray-400" />
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                                  {dispute.status || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-900 max-w-[150px]">
                                <p className="line-clamp-2 leading-relaxed">
                                  {dispute.reason || 'No reason provided'}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center text-xs text-gray-900">
                                <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                                {formatDate(dispute.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => { setSelectedDispute(dispute); setShowModal(true); }}
                                  className="p-1.5 text-[#B38939] hover:text-white hover:bg-[#B38939] rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
                                  title="View Details"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setSelectedDispute(dispute); setShowChatModal(true); }}
                                  className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
                                  title="Open Chat"
                                >
                                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                </button>
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
                  {paginatedDisputes.map((dispute) => {
                    const { buyerName, sellerName } = getParticipantsDisplay(dispute.transactionId);
                    const StatusIcon = getStatusIcon(dispute.status);
                    return (
                      <div key={dispute._id} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-md mr-3">
                              <DocumentTextIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900">{dispute.transactionId?.reference || 'No Reference'}</div>
                              <div className="text-xs text-gray-500">ID: {dispute._id?.slice(-8) || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <StatusIcon className="w-4 h-4 mr-1 text-gray-400" />
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                              {dispute.status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Participants:</p>
                            <div className="space-y-1">
                              {[{name: buyerName, role: 'Buyer', color: 'purple'}, {name: sellerName, role: 'Seller', color: 'orange'}].map(({name, role, color}) => (
                                <div key={role} className="flex items-center text-xs">
                                  <div className={`w-2 h-2 bg-${color}-500 rounded-full mr-2`}></div>
                                  <span className="font-medium text-gray-900">{name}</span>
                                  <span className={`ml-1 text-xs text-${color}-600 bg-${color}-100 px-1.5 py-0.5 rounded-full`}>{role}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-gray-600">Reason:</p>
                            <p className="text-xs text-gray-900 mt-1 line-clamp-2">{dispute.reason || 'No reason provided'}</p>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-600">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {formatDate(dispute.createdAt)}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => { setSelectedDispute(dispute); setShowModal(true); }}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-lg hover:shadow-md transition-all duration-200"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Details
                          </button>
                          <button
                            onClick={() => { setSelectedDispute(dispute); setShowChatModal(true); }}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-md transition-all duration-200"
                          >
                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                            Chat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                    <div className="text-xs text-gray-700">
                      Showing <span className="font-semibold">{paginatedDisputes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
                      <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredDisputes.length)}</span> of{' '}
                      <span className="font-semibold">{filteredDisputes.length}</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                      >
                        <ChevronLeftIcon className="w-4 h-4 mr-1" />
                        Prev
                      </button>
                      <div className="flex items-center space-x-1">
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                                currentPage === pageNum
                                  ? 'bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white shadow-md'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                      >
                        Next
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-[#B38939]/20 to-[#D4AF37]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="w-8 h-8 text-[#B38939]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No disputes found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your search criteria or check back later</p>
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-lg hover:shadow-md transition-all duration-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Dispute Details Modal */}
          {showModal && selectedDispute && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 transition-opacity duration-200">
              <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-lg transition-transform duration-200 transform scale-100">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-md mr-3">
                        <DocumentTextIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Dispute Details</h3>
                        <p className="text-gray-500 text-xs">Review and manage dispute resolution</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {label: 'Dispute ID', value: selectedDispute._id || 'N/A', mono: true},
                        {label: 'Status', value: (() => {
                          const StatusIcon = getStatusIcon(selectedDispute.status);
                          return (
                            <div className="flex items-center">
                              <StatusIcon className="w-4 h-4 mr-1 text-gray-400" />
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(selectedDispute.status)}`}>
                                {selectedDispute.status || 'Unknown'}
                              </span>
                            </div>
                          );
                        })()},
                        {label: 'Transaction Reference', value: selectedDispute.transactionId?.reference || selectedDispute.transactionId?._id || 'N/A'},
                        {label: 'Date Created', value: formatDate(selectedDispute.createdAt)}
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

                  {/* Participants */}
                  <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <UserGroupIcon className="w-4 h-4 mr-1 text-blue-600" />
                      Transaction Participants
                    </h4>
                    <div className="space-y-3">
                      {selectedDispute.transactionId?.participants?.length > 0 ? (
                        selectedDispute.transactionId.participants.map((participant, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                                participant.role === 'buyer' ? 'bg-purple-100' : 'bg-orange-100'
                              }`}>
                                <UserGroupIcon className={`w-4 h-4 ${
                                  participant.role === 'buyer' ? 'text-purple-600' : 'text-orange-600'
                                }`} />
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-gray-900">
                                  {participant.userId?.firstName
                                    ? `${participant.userId.firstName} ${participant.userId.lastName || ''}`.trim()
                                    : 'Unknown User'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {participant.userId?.email || 'No email available'}
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              participant.role === 'buyer'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}>
                              {participant.role || 'Unknown'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500 text-sm">No participant details available</div>
                      )}
                    </div>
                  </div>

                  {/* Dispute Details */}
                  <div className="bg-gradient-to-r from-red-50 to-white p-4 rounded-lg border border-red-100">
                    <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-red-600" />
                      Dispute Reason
                    </h4>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-900 leading-relaxed">{selectedDispute.reason || 'No reason provided'}</p>
                    </div>
                  </div>

                  {/* Evidence */}
                  {selectedDispute.evidence?.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-lg border border-green-100">
                      <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                        <DocumentTextIcon className="w-4 h-4 mr-1 text-green-600" />
                        Evidence Submitted
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedDispute.evidence.map((ev, index) => (
                          <a
                            key={index}
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-[#B38939]"
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-2 text-[#B38939]" />
                            <span className="text-xs font-medium text-gray-900 truncate">
                              {ev.filename || `Evidence ${index + 1}`}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution Actions */}
                  {selectedDispute.status !== 'Resolved' && (
                    <div className="bg-gradient-to-r from-[#B38939]/10 to-[#D4AF37]/10 p-4 rounded-lg border border-[#B38939]/20">
                      <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1 text-[#B38939]" />
                        Resolve Dispute
                      </h4>
                      <p className="text-gray-600 text-sm mb-4">Choose the appropriate resolution:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleResolveDispute(selectedDispute._id, 'Resolved in favor of buyer')}
                          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105"
                        >
                          <UserGroupIcon className="w-4 h-4 mr-1" />
                          Favor Buyer
                        </button>
                        <button
                          onClick={() => handleResolveDispute(selectedDispute._id, 'Resolved in favor of seller')}
                          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105"
                        >
                          <UserGroupIcon className="w-4 h-4 mr-1" />
                          Favor Seller
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat Modal */}
          {showChatModal && selectedDispute && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 transition-opacity duration-200">
              <div className="bg-white rounded-xl w-full max-w-xl max-h-[80vh] overflow-hidden shadow-lg transition-transform duration-200 transform scale-100 flex flex-col">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-[#B38939] to-[#D4AF37] p-4 text-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shadow-md mr-3">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Dispute Chat</h3>
                        <p className="text-white/80 text-xs">
                          Transaction: {selectedDispute.transactionId?.reference || 'No Reference'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowChatModal(false)}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 max-h-[50vh]">
                  {messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages.map((msg, index) => (
                        <div
                          key={msg._id || index}
                          className={`flex ${msg.userRole === 'Admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${msg.userRole === 'Admin' ? 'order-2' : 'order-1'}`}>
                            <div className={`p-3 rounded-lg shadow-md ${
                              msg.userRole === 'Admin'
                                ? 'bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white'
                                : msg.userRole === 'Buyer'
                                ? 'bg-white border-l-4 border-purple-500 text-gray-900'
                                : 'bg-white border-l-4 border-orange-500 text-gray-900'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-semibold uppercase tracking-wide ${
                                  msg.userRole === 'Admin' ? 'text-white/80' : 'text-gray-500'
                                }`}>
                                  {msg.userRole === 'Admin'
                                    ? 'Admin Support'
                                    : msg.userId?.firstName
                                    ? `${msg.userId.firstName} ${msg.userId.lastName || ''} (${msg.userRole})`
                                    : `${msg.userRole} User`}
                                </span>
                                <span className={`text-xs ${msg.userRole === 'Admin' ? 'text-white/60' : 'text-gray-400'}`}>
                                  {formatDate(msg.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed">{msg.message || 'No message content'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No messages yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start the conversation</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-transparent resize-none text-xs bg-gray-50"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 flex items-center text-xs"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                      Send
                    </button>
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

export default Disputes;