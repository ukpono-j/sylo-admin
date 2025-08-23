import { useEffect, useState, useMemo, useCallback } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import moment from 'moment-timezone';

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setError(null);
        setLoading(true);
        const response = await axiosInstance.get('/api/admin/withdrawals');
        console.log('Raw withdrawal requests:', response.data.data);
        setWithdrawals(response.data.data);
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
        setError(error.message || 'Failed to fetch withdrawal requests');
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, []);

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
    } catch (error) {
      console.error('Error marking withdrawal as paid:', error);
      setError(error.response?.data?.error || 'Failed to mark withdrawal as paid');
    } finally {
      setProcessing(prev => ({ ...prev, [reference]: false }));
    }
  }, []);

  const filteredWithdrawals = useMemo(() => 
    statusFilter === 'all' ? withdrawals : withdrawals.filter(w => w.status === statusFilter), 
    [withdrawals, statusFilter]
  );

  return (
    <div className="flex min-h-screen bg-gray-100 font-['Bricolage_Grotesque']">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-200 transition-margin duration-300 pt-16 lg:pt-8 ${isCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[250px]'}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#1A202C] mb-6 sm:mb-8 tracking-tight">
            Withdrawal Requests
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="mb-6 flex items-center gap-3">
            <label className="text-sm font-medium text-[#1A202C]">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B38939]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B38939] mx-auto mb-4"></div>
                <div className="text-gray-500 text-base sm:text-lg">Loading withdrawals...</div>
              </div>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center text-gray-500 text-base sm:text-lg">No withdrawal requests found</div>
          ) : (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <div className="block lg:hidden space-y-4">
                {filteredWithdrawals.map(w => (
                  <div key={w.reference} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">User:</span> 
                        <div className="font-medium text-[#1A202C]">{w.userName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{w.userEmail}</div>
                      </div>
                      <div><span className="font-medium text-gray-600">Amount:</span> ₦{w.amount.toLocaleString()}</div>
                      <div>
                        <span className="font-medium text-gray-600">Bank:</span> 
                        <div className="font-semibold">{w.metadata.bankName}</div>
                        <div>{w.metadata.accountName}</div>
                        <div className="text-xs text-gray-500">{w.metadata.accountNumber}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                          w.status === 'paid' ? 'bg-green-100 text-green-800' :
                          w.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                      </div>
                      <div><span className="font-medium text-gray-600">Request Date:</span> {moment(w.createdAt).tz('Africa/Lagos').format('MMM D, YYYY')}</div>
                      <div>
                        {w.status === 'pending' ? (
                          <button
                            onClick={() => handleMarkAsPaid(w.reference)}
                            disabled={processing[w.reference]}
                            className={`w-full mt-2 px-4 py-2.5 rounded-lg text-white text-sm ${
                              processing[w.reference]
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#B38939] hover:bg-[#BB954D]'
                            } transition-colors duration-200`}
                          >
                            {processing[w.reference] ? 'Processing...' : 'Mark as Paid'}
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            {w.status === 'paid'
                              ? `Paid on ${moment(w.metadata.paidDate).tz('Africa/Lagos').format('MMM D, YYYY')}`
                              : 'No action available'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Bank Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Request Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#1A202C] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWithdrawals.map(w => (
                      <tr key={w.reference} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm text-[#1A202C]">
                          <div className="font-medium">{w.userName}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{w.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#B38939]">
                          ₦{w.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1A202C]">
                          <div className="font-semibold">{w.metadata.bankName}</div>
                          <div>{w.metadata.accountName}</div>
                          <div className="text-xs text-gray-500">{w.metadata.accountNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                            w.status === 'paid' ? 'bg-green-100 text-green-800' :
                            w.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {moment(w.createdAt).tz('Africa/Lagos').format('MMM D, YYYY')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {w.status === 'pending' ? (
                            <button
                              onClick={() => handleMarkAsPaid(w.reference)}
                              disabled={processing[w.reference]}
                              className={`px-4 py-2.5 rounded-lg text-white text-sm ${
                                processing[w.reference]
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-[#B38939] hover:bg-[#BB954D]'
                              } transition-colors duration-200`}
                            >
                              {processing[w.reference] ? 'Processing...' : 'Mark as Paid'}
                            </button>
                          ) : (
                            <span className="text-gray-500 text-sm">
                              {w.status === 'paid'
                                ? `Paid on ${moment(w.metadata.paidDate).tz('Africa/Lagos').format('MMM D, YYYY')}`
                                : 'No action available'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Withdrawals;