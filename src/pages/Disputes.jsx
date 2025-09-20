import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import {
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import moment from 'moment-timezone';
import io from 'socket.io-client';

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

  // Fetch messages for selected dispute
  const fetchMessages = useCallback(async (disputeId) => {
    try {
      const response = await axiosInstance.get(`/api/disputes/${disputeId}`);
      setMessages(response.data.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error.response?.data?.error || 'Failed to fetch messages');
    }
  }, []);

  // Updated socket event handler
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      auth: { token: localStorage.getItem('adminToken') },
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected for admin disputes');
    });

    socketRef.current.on('disputeMessage', (message) => {
      console.log('Received socket message:', message);

      // Only add message if it's for the current dispute and not already in the list
      if (message.disputeId === selectedDispute?._id) {
        setMessages((prev) => {
          // Check if message already exists (to prevent duplicates)
          const existingMessage = prev.find(msg => msg._id === message._id);
          if (existingMessage) {
            return prev; // Don't add duplicate
          }

          // Ensure the message has the correct structure
          const structuredMessage = {
            _id: message._id,
            disputeId: message.disputeId,
            userId: message.userId,
            userRole: message.userRole,
            message: message.message,
            timestamp: message.timestamp
          };

          return [...prev, structuredMessage];
        });
      }
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to chat server');
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [selectedDispute]);

  // Join dispute room and fetch messages when chat modal opens
  useEffect(() => {
    if (showChatModal && selectedDispute) {
      socketRef.current.emit('join-dispute-room', selectedDispute._id, localStorage.getItem('adminToken'));
      fetchMessages(selectedDispute._id);
    }
  }, [showChatModal, selectedDispute, fetchMessages]);

  // Fetch disputes
  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/disputes/admin/all');
      const disputesData = response.data.data.disputes || [];
      setDisputes(disputesData);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      setError(error.response?.data?.error || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);


  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedDispute) return;

    try {
      const response = await axiosInstance.post(`/api/disputes/${selectedDispute._id}/messages`, {
        message: newMessage,
      });

      console.log('Message send response:', response.data);

      // Extract the message data from response
      const messageData = response.data.data;

      // Create properly structured message for immediate UI update
      const newMsg = {
        _id: messageData._id,
        disputeId: messageData.disputeId,
        userId: messageData.userId,
        userRole: messageData.userRole,
        message: messageData.message,
        timestamp: messageData.timestamp
      };

      // Add to messages state immediately for better UX
      setMessages((prev) => [...prev, newMsg]);

      // Clear the input
      setNewMessage('');

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.error || 'Failed to send message');
    }
  }, [newMessage, selectedDispute]);

  // Handle resolving dispute
  const handleResolveDispute = useCallback(async (disputeId, resolution) => {
    try {
      await axiosInstance.put(`/api/disputes/admin/${disputeId}/status`, { status: 'Resolved', resolution });
      setDisputes((prev) =>
        prev.map((d) => (d._id === disputeId ? { ...d, status: 'Resolved', resolution } : d))
      );
      setShowModal(false);
      socketRef.current.emit('disputeStatusUpdate', { disputeId, status: 'Resolved' });
    } catch (error) {
      console.error('Error resolving dispute:', error);
      setError(error.response?.data?.error || 'Failed to resolve dispute');
    }
  }, []);

  // Filter disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      const transaction = dispute.transactionId;
      const matchesSearch =
        transaction?.reference?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        dispute._id?.toString()?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        transaction?.userId?.firstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        transaction?.userId?.lastName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        transaction?.participants?.some((p) =>
          p.userId?.firstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
          p.userId?.lastName?.toLowerCase()?.includes(searchTerm.toLowerCase())
        );
      const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [disputes, searchTerm, statusFilter]);

  // Paginate disputes
  const totalPages = useMemo(() => Math.ceil(filteredDisputes.length / itemsPerPage), [filteredDisputes]);
  const paginatedDisputes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDisputes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDisputes, currentPage]);

  // Utility functions
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }, []);

  const formatDate = useCallback((date) => {
    return date ? moment(date).tz('Africa/Lagos').format('MMM D, YYYY HH:mm') : 'N/A';
  }, []);

  const getParticipantsDisplay = useCallback((transaction) => {
    const getFullName = (user) => {
      if (!user || !user.firstName) return 'Unknown';
      return `${user.firstName} ${user.lastName || ''}`.trim();
    };

    const creator = transaction?.userId;
    const creatorRole = transaction?.selectedUserType;
    const otherParticipant = transaction?.participants?.find((p) => p.role !== creatorRole);

    const creatorName = getFullName(creator);
    const otherName = getFullName(otherParticipant?.userId);

    const buyerName = creatorRole === 'buyer' ? creatorName : otherName;
    const sellerName = creatorRole === 'seller' ? creatorName : otherName;

    return { buyerName, sellerName };
  }, []);

  const viewDisputeDetails = useCallback((dispute) => {
    setSelectedDispute(dispute);
    setShowModal(true);
  }, []);

  const viewDisputeChat = useCallback((dispute) => {
    setSelectedDispute(dispute);
    setShowChatModal(true);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 font-['Bricolage_Grotesque']">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-200 transition-margin duration-300 pt-16 lg:pt-8 ${isCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[250px]'
          }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#1A202C] tracking-tight mb-4 sm:mb-0">
              Disputes
            </h2>
            <button
              onClick={fetchDisputes}
              className="flex items-center px-4 py-2.5 bg-[#B38939] text-white rounded-lg hover:bg-[#BB954D] transition-colors duration-200 hover:scale-[1.03] shadow-sm hover:shadow-md"
              aria-label="Refresh disputes"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center shadow-sm transition-opacity duration-300">
              <span>
                <strong>Error:</strong> {error}
              </span>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900 transition-colors duration-200 p-2"
                aria-label="Dismiss error"
              >
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
                  placeholder="Search disputes..."
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
                <option value="Open">Open</option>
                <option value="Resolved">Resolved</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <div className="flex items-center text-gray-600 text-sm">
                <FunnelIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                {filteredDisputes.length} of {disputes.length} disputes
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#B38939] mx-auto mb-4"></div>
                  <div className="text-gray-500 text-base sm:text-lg">Loading disputes...</div>
                </div>
              </div>
            ) : paginatedDisputes.length > 0 ? (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">
                          Transaction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">
                          Participants
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedDisputes.map((dispute) => {
                        const { buyerName, sellerName } = getParticipantsDisplay(dispute.transactionId);
                        return (
                          <tr
                            key={dispute._id}
                            className="hover:bg-[#BB954D]/10 transition-colors duration-200"
                          >
                            <td className="px-6 py-4">
                              <div className="text-[#1A202C] font-medium text-sm truncate max-w-[160px]">
                                {dispute.transactionId?.reference || dispute.transactionId?._id || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className="flex flex-col space-y-1 text-[#1A202C] font-medium max-w-[280px] line-clamp-2"
                                title={`${buyerName} (Buyer)\n${sellerName} (Seller)`}
                              >
                                <span>
                                  {buyerName} <span className="text-gray-500 font-normal">(Buyer)</span>
                                </span>
                                <span>
                                  {sellerName} <span className="text-gray-500 font-normal">(Seller)</span>
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  dispute.status
                                )}`}
                              >
                                {dispute.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-[#1A202C] text-sm max-w-[200px] line-clamp-2">
                                {dispute.reason || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[#1A202C] text-sm">
                              {formatDate(dispute.createdAt)}
                            </td>
                            <td className="px-6 py-4 flex space-x-2">
                              <button
                                onClick={() => viewDisputeDetails(dispute)}
                                className="text-[#B38939] hover:text-[#BB954D] transition-colors duration-200 hover:scale-[1.03] p-2"
                                aria-label="View dispute details"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => viewDisputeChat(dispute)}
                                className="text-[#B38939] hover:text-[#BB954D] transition-colors duration-200 hover:scale-[1.03] p-2"
                                aria-label="View dispute chat"
                              >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="block lg:hidden space-y-4 p-4">
                  {paginatedDisputes.map((dispute) => {
                    const { buyerName, sellerName } = getParticipantsDisplay(dispute.transactionId);
                    return (
                      <div
                        key={dispute._id}
                        className="bg-gray-50 p-4 rounded-lg shadow-sm transition-colors duration-200 hover:bg-[#BB954D]/10"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-[#1A202C] font-medium max-w-[220px] sm:max-w-[280px] line-clamp-2 text-sm"
                              title={`${buyerName} (Buyer)\n${sellerName} (Seller)`}
                            >
                              <div>
                                {buyerName} <span className="text-gray-500 font-normal">(Buyer)</span>
                              </div>
                              <div>
                                {sellerName} <span className="text-gray-500 font-normal">(Seller)</span>
                              </div>
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              Transaction:{' '}
                              <span className="text-[#1A202C] font-medium">
                                {dispute.transactionId?.reference || dispute.transactionId?._id || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                dispute.status
                              )}`}
                            >
                              {dispute.status || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Reason:</span>{' '}
                            {dispute.reason || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Date:</span>{' '}
                            {formatDate(dispute.createdAt)}
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => viewDisputeDetails(dispute)}
                            className="w-full flex justify-center text-[#B38939] hover:text-[#BB954D] transition-colors duration-200 hover:scale-[1.03] p-2"
                            aria-label="View dispute details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => viewDisputeChat(dispute)}
                            className="w-full flex justify-center text-[#B38939] hover:text-[#BB954D] transition-colors duration-200 hover:scale-[1.03] p-2"
                            aria-label="View dispute chat"
                          >
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
                    <div className="text-sm text-gray-700">
                      Showing{' '}
                      {paginatedDisputes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredDisputes.length)} of{' '}
                      {filteredDisputes.length} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
                <div className="text-gray-500 text-base sm:text-lg mb-2">No disputes found</div>
                <div className="text-gray-400 text-sm">Try adjusting your search criteria</div>
              </div>
            )}
          </div>

          {showModal && selectedDispute && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
              <div className="bg-white rounded-xl w-full max-w-[90vw] sm:max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto shadow-xl transition-transform duration-300 transform scale-100">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-[#1A202C]">
                      Dispute Details
                    </h3>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dispute ID
                        </label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded truncate">
                          {selectedDispute._id || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            selectedDispute.status
                          )}`}
                        >
                          {selectedDispute.status || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded truncate">
                        {selectedDispute.transactionId?.reference || selectedDispute.transactionId?._id || 'N/A'}
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-sm">Participants</h4>
                      <div className="space-y-4">
                        {selectedDispute.transactionId?.participants?.length > 0 ? (
                          selectedDispute.transactionId.participants.map((participant, index) => (
                            <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Role
                                </label>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${participant.role === 'buyer'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                                    }`}
                                >
                                  {participant.role || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Name
                                </label>
                                <div className="text-sm text-gray-900 truncate max-w-[220px] sm:max-w-[280px]">
                                  {participant.userId?.firstName
                                    ? `${participant.userId.firstName} ${participant.userId.lastName || ''
                                      }`.trim()
                                    : 'Unknown'}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">
                            No participant details available
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded line-clamp-3">
                        {selectedDispute.reason || 'N/A'}
                      </div>
                    </div>
                    {selectedDispute.evidence?.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">Evidence</h4>
                        <div className="space-y-2">
                          {selectedDispute.evidence.map((ev, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#B38939] hover:text-[#BB954D] text-sm truncate max-w-[220px] sm:max-w-[280px]"
                              >
                                {ev.filename || `Evidence ${index + 1}`}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created Date
                      </label>
                      <div className="text-sm text-gray-900">
                        {formatDate(selectedDispute.createdAt)}
                      </div>
                    </div>
                    {selectedDispute.status !== 'Resolved' && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">Resolve Dispute</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleResolveDispute(selectedDispute._id, 'Resolved in favor of buyer')
                            }
                            className="flex-1 px-4 py-2 bg-[#B38939] text-white rounded-lg hover:bg-[#BB954D] transition-colors duration-200 shadow-sm hover:shadow-md"
                          >
                            Favor Buyer
                          </button>
                          <button
                            onClick={() =>
                              handleResolveDispute(selectedDispute._id, 'Resolved in favor of seller')
                            }
                            className="flex-1 px-4 py-2 bg-[#1A202C] text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm hover:shadow-md"
                          >
                            Favor Seller
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showChatModal && selectedDispute && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
              <div className="bg-white rounded-xl w-full max-w-[90vw] sm:max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto shadow-xl transition-transform duration-300 transform scale-100">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-[#1A202C]">
                      Dispute Chat
                    </h3>
                    <button
                      onClick={() => setShowChatModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2"
                      aria-label="Close chat modal"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                 {/* // Updated message rendering in the chat modal */}
                  <div className="bg-gray-50 p-4 rounded-lg max-h-[50vh] overflow-y-auto mb-4">
                    {messages.length > 0 ? (
                      messages.map((msg, index) => (
                        <div
                          key={msg._id || index}
                          className={`mb-3 flex ${msg.userRole === 'Admin'
                              ? 'justify-end'
                              : msg.userRole === 'Buyer'
                                ? 'justify-start'
                                : 'justify-start'
                            }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg text-sm ${msg.userRole === 'Admin'
                                ? 'bg-[#B38939] text-white'
                                : msg.userRole === 'Buyer'
                                  ? 'bg-purple-100 text-purple-900'
                                  : 'bg-orange-100 text-orange-900'
                              }`}
                          >
                            <div className="font-medium">
                              {msg.userRole === 'Admin'
                                ? 'Admin'
                                : msg.userId?.firstName
                                  ? `${msg.userId.firstName} ${msg.userId.lastName || ''} (${msg.userRole
                                  })`
                                  : `${msg.userRole} User`}
                            </div>
                            <div>{msg.message || 'No message content'}</div>
                            <div className="text-xs opacity-70 mt-1">
                              {formatDate(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-center text-sm">
                        No messages yet
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B38939] focus:border-transparent hover:ring-2 hover:ring-[#B38939]/50 transition-colors duration-200 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2.5 bg-[#B38939] text-white rounded-lg hover:bg-[#BB954D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
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