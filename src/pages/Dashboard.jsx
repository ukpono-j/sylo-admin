import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement } from 'chart.js';
import moment from 'moment-timezone';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

// Set global Chart.js font
ChartJS.defaults.font.family = 'Bricolage Grotesque';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionStats, setTransactionStats] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const [statsResponse, transactionsResponse] = await Promise.all([
          axiosInstance.get('/api/admin/dashboard-stats'),
          axiosInstance.get('/api/admin/transactions'),
        ]);
        setStats(statsResponse.data.data);

        const allTransactions = transactionsResponse.data.data.transactions;

        // Compute transaction status stats for pie chart
        const statusCounts = allTransactions.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {});
        setTransactionStats(statusCounts);

        // Filter for completed transactions and validate data
        const completedTransactions = allTransactions
          .filter(t => {
            const isValid = t.status === 'completed' && t.paymentAmount != null && t.createdAt;
            if (!isValid) {
              console.log('Filtered out transaction:', t);
            }
            return isValid;
          })
          .map(t => ({
            ...t,
            amount: Number(t.paymentAmount),
            createdAt: moment(t.createdAt).isValid() ? t.createdAt : moment(),
          }));

        setTransactions(completedTransactions);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(
          error.response?.data?.details
            ? `${error.message}: ${error.response.data.details}`
            : error.message || 'Failed to fetch dashboard data'
        );
      }
    };

    fetchStats();
  }, []);

  // Calculate total and average completed transaction amounts
  const totalCompletedAmount = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const averageCompletedAmount = transactions.length > 0 ? totalCompletedAmount / transactions.length : 0;

  // Get recent activities from transactions (limited to 3)
  const recentActivities = transactions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)
    .map(t => ({
      text: `Transaction ${t.status} (${t.paymentAmount ? `₦${Number(t.paymentAmount).toLocaleString()}` : 'N/A'})`,
      time: moment(t.createdAt).tz('Africa/Lagos').fromNow(),
      type: t.status,
    }));

  // Calculate percentage change for trends
  const calculateTrend = (current, previous) => {
    if (previous === 0 || previous == null) {
      return current > 0 ? '↗ New' : '→ 0%';
    }
    const change = ((current - previous) / previous) * 100;
    if (change === 0) return '→ 0%';
    return change > 0
      ? `↗ ${change.toFixed(1)}%`
      : `↘ ${Math.abs(change).toFixed(1)}%`;
  };

  // Calculate trends using transactions data
  const currentMonth = moment().tz('Africa/Lagos').startOf('month');
  const lastMonth = moment().tz('Africa/Lagos').subtract(1, 'month').startOf('month');
  const endOfLastMonth = moment().tz('Africa/Lagos').subtract(1, 'month').endOf('month');

  // Transaction Count Trend
  const currentTransactionCount = transactions.filter(t => moment(t.createdAt).isSameOrAfter(currentMonth)).length;
  const lastTransactionCount = transactions.filter(t => 
    moment(t.createdAt).isSameOrAfter(lastMonth) && moment(t.createdAt).isBefore(currentMonth)
  ).length;
  const transactionTrend = calculateTrend(currentTransactionCount, lastTransactionCount);

  // Pending Withdrawals Trend
  const currentPendingWithdrawals = transactions
    .filter(t => t.status === 'pending' && moment(t.createdAt).isSameOrAfter(currentMonth))
    .reduce((sum, t) => sum + (Number(t.paymentAmount) || 0), 0);
  const lastPendingWithdrawals = transactions
    .filter(t => t.status === 'pending' && moment(t.createdAt).isSameOrAfter(lastMonth) && moment(t.createdAt).isBefore(currentMonth))
    .reduce((sum, t) => sum + (Number(t.paymentAmount) || 0), 0);
  const pendingWithdrawalsTrend = calculateTrend(currentPendingWithdrawals, lastPendingWithdrawals);

  // Line chart data
  const getLineChartData = () => {
    const monthlyData = transactions.reduce((acc, tx) => {
      const month = moment(tx.createdAt).tz('Africa/Lagos').format('MMM YYYY');
      acc[month] = (acc[month] || 0) + (tx.amount || 0);
      return acc;
    }, {});

    const labels = [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const month = moment().tz('Africa/Lagos').subtract(i, 'months').format('MMM YYYY');
      labels.push(month);
      data.push(monthlyData[month] || 0);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Completed Transaction Amounts (₦)',
          data,
          borderColor: '#B38939',
          backgroundColor: 'rgba(187, 149, 61, 0.2)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1A202C',
          font: { family: 'Bricolage Grotesque', size: 12, weight: 400 },
        },
      },
      title: {
        display: true,
        text: 'Completed Transactions Over Time',
        color: '#1A202C',
        font: { family: 'Bricolage Grotesque', size: 16, weight: 600 },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        titleFont: { family: 'Bricolage Grotesque', size: 12, weight: 600 },
        bodyFont: { family: 'Bricolage Grotesque', size: 10, weight: 400 },
        callbacks: { label: (context) => `₦${context.parsed.y.toLocaleString()}` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#1A202C',
          font: { family: 'Bricolage Grotesque', size: 10, weight: 400 },
          callback: (value) => `₦${value.toLocaleString()}`,
        },
        grid: { color: '#E2E8F0' },
      },
      x: {
        ticks: {
          color: '#1A202C',
          font: { family: 'Bricolage Grotesque', size: 10, weight: 400 },
        },
        grid: { display: false },
      },
    },
  };

  // Pie chart data
  const getPieChartData = () => {
    const labels = Object.keys(transactionStats);
    const data = Object.values(transactionStats);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#B38939', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
          hoverOffset: 8,
        },
      ],
    };
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1A202C',
          font: { family: 'Bricolage Grotesque', size: 12, weight: 400 },
        },
      },
      title: {
        display: true,
        text: 'Transaction Status Breakdown',
        color: '#1A202C',
        font: { family: 'Bricolage Grotesque', size: 16, weight: 600 },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        titleFont: { family: 'Bricolage Grotesque', size: 12, weight: 600 },
        bodyFont: { family: 'Bricolage Grotesque', size: 10, weight: 400 },
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-100 w-full overflow-x-hidden font-['Bricolage_Grotesque']">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      
       <div
        className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-200 transition-all duration-300 lg:pt-8"
        style={{
          marginLeft: window.innerWidth >= 1024 ? (isCollapsed ? '88px' : '250px') : '0px',
        }}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1A202C] tracking-tight">
              Admin Dashboard
            </h2>
            <div className="mt-2 sm:mt-0 text-sm text-gray-500">
              Last updated: {moment().tz('Africa/Lagos').format('MMM DD, YYYY HH:mm')}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-r-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Error occurred</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    title: 'Total Users', 
                    value: stats.userCount, 
                    trend: calculateTrend(stats.userCount, stats.userCountLastMonth), 
                    icon: '👥', 
                    description: 'Active platform users' 
                  },
                  { 
                    title: 'Total Transactions', 
                    value: stats.transactionCount, 
                    trend: transactionTrend, 
                    icon: '💳', 
                    description: 'All transaction records' 
                  },
                  { 
                    title: 'Pending KYC', 
                    value: stats.pendingKYC, 
                    trend: calculateTrend(stats.pendingKYC, stats.pendingKYCLastMonth), 
                    icon: '📋', 
                    description: 'Awaiting verification' 
                  },
                  { 
                    title: 'Pending Withdrawals', 
                    value: `₦${stats.pendingWithdrawals.toLocaleString()}`, 
                    trend: pendingWithdrawalsTrend, 
                    icon: '💰', 
                    description: 'Awaiting processing' 
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-[#B38939] group-hover:bg-opacity-10 transition-colors duration-300">
                        <span className="text-xl">{item.icon}</span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.trend.includes('↗') ? 'bg-green-100 text-green-800' : 
                            item.trend.includes('↘') ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.trend}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">{item.title}</h3>
                    <p className="text-2xl font-bold text-[#1A202C] mb-1">{item.value}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                ))}
              </div>

              {/* Transaction Analysis Summary */}
              {(transactions.length > 0 || Object.keys(transactionStats).length > 0) && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-[#1A202C]">Transaction Overview</h3>
                    <div className="text-sm text-gray-500">Last 6 months data</div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-[#B38939] to-[#BB954D] p-4 rounded-lg text-white">
                      <div className="text-sm opacity-90 mb-1">Completed Transactions</div>
                      <div className="text-xl font-bold">{transactions.length}</div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-700 to-[#1A202C] p-4 rounded-lg text-white">
                      <div className="text-sm opacity-90 mb-1">Total Amount</div>
                      <div className="text-xl font-bold">₦{totalCompletedAmount.toLocaleString()}</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                      <div className="text-sm opacity-90 mb-1">Average Amount</div>
                      <div className="text-xl font-bold">₦{averageCompletedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                      <div className="text-sm opacity-90 mb-1">All Transactions</div>
                      <div className="text-xl font-bold">{stats.transactionCount}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Section */}
              {(transactions.length > 0 || Object.keys(transactionStats).length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {transactions.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="h-80">
                        <Line data={getLineChartData()} options={lineChartOptions} />
                      </div>
                    </div>
                  )}
                  {Object.keys(transactionStats).length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="h-80">
                        <Doughnut data={getPieChartData()} options={pieChartOptions} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#1A202C]">Recent Activity</h3>
                  <button className="text-sm text-[#B38939] hover:text-[#BB954D] font-medium">View All</button>
                </div>
                {recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-3 ${
                            activity.type === 'completed'
                              ? 'bg-green-500'
                              : activity.type === 'pending'
                              ? 'bg-yellow-500'
                              : activity.type === 'failed'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                        ></div>
                        <div className="flex-1">
                          <span className="text-sm text-gray-700">{activity.text}</span>
                        </div>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center">No recent transactions available.</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-[#1A202C] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { text: 'Export Data', variant: 'primary' },
                    { text: 'Send Notice', variant: 'secondary' },
                    { text: 'View Reports', variant: 'outline-primary' },
                    { text: 'Settings', variant: 'outline-secondary' },
                  ].map((button, index) => (
                    <button
                      key={index}
                      className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        button.variant === 'primary'
                          ? 'bg-[#B38939] hover:bg-[#BB954D] text-white shadow-sm hover:shadow-md'
                          : button.variant === 'secondary'
                          ? 'bg-[#1A202C] hover:bg-gray-800 text-white shadow-sm hover:shadow-md'
                          : button.variant === 'outline-primary'
                          ? 'border-2 border-[#B38939] text-[#B38939] hover:bg-[#B38939] hover:text-white'
                          : 'border-2 border-[#1A202C] text-[#1A202C] hover:bg-[#1A202C] hover:text-white'
                      }`}
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : !error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B38939] mx-auto mb-4"></div>
                <div className="text-gray-500">Loading dashboard data...</div>
              </div>
            </div>
          ) : null}

          {(transactions.length === 0 && Object.keys(transactionStats).length === 0 && stats) && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="text-gray-400 text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-[#1A202C] mb-2">No Transaction Data</h3>
              <p className="text-gray-500">Transaction charts will appear here once data is available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;