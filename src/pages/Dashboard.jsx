import { useEffect, useState, useMemo, useCallback } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement } from 'chart.js';
import moment from 'moment-timezone';
import axios from 'axios';
import { 
  UserGroupIcon, 
  CreditCardIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  BoltIcon, 
  ArrowDownTrayIcon, 
  BellIcon, 
  CogIcon, 
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

// Set global Chart.js font
ChartJS.defaults.font.family = 'Bricolage Grotesque';

// Sidebar configuration for consistent dimensions
const SIDEBAR_CONFIG = {
  expanded: {
    width: 280,
    margin: 'lg:ml-[280px]'
  },
  collapsed: {
    width: 90,
    margin: 'lg:ml-[90px]'
  }
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionStats, setTransactionStats] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data
  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setError(null);
        const [statsResponse, transactionsResponse] = await Promise.all([
          axiosInstance.get('/api/admin/dashboard-stats'),
          axiosInstance.get('/api/admin/transactions'),
        ]);

        if (!isMounted) return;

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
          .filter(t => t.status === 'completed' && t.paymentAmount != null && t.createdAt)
          .map(t => ({
            ...t,
            amount: Number(t.paymentAmount),
            createdAt: moment(t.createdAt).isValid() ? t.createdAt : moment(),
          }));

        setTransactions(completedTransactions);
      } catch (error) {
        if (!isMounted || axios.isCancel(error)) return;

        if (error.message !== 'Session expired. Please login again.' && 
            error.message !== 'Authentication failed. Please login again.') {
          console.error('Error fetching data:', error);
          setError(
            error.response?.data?.details
              ? `${error.message}: ${error.response.data.details}`
              : error.message || 'Failed to fetch dashboard data'
          );
        }
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, []);

  // Memoized calculations
  const totalCompletedAmount = useMemo(() =>
    transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0), [transactions]
  );
  
  const averageCompletedAmount = useMemo(() =>
    transactions.length > 0 ? totalCompletedAmount / transactions.length : 0, 
    [transactions, totalCompletedAmount]
  );

  const calculateTrend = useCallback((current, previous) => {
    if (previous === 0 || previous == null) {
      return current > 0 ? '↗ New' : '→ 0%';
    }
    const change = ((current - previous) / previous) * 100;
    if (change === 0) return '→ 0%';
    return change > 0 ? `↗ ${change.toFixed(1)}%` : `↘ ${Math.abs(change).toFixed(1)}%`;
  }, []);

  // Calculate trends
  const currentMonth = moment().tz('Africa/Lagos').startOf('month');
  const lastMonth = moment().tz('Africa/Lagos').subtract(1, 'month').startOf('month');

  const currentTransactionCount = useMemo(() =>
    transactions.filter(t => moment(t.createdAt).isSameOrAfter(currentMonth)).length, [transactions]
  );
  
  const lastTransactionCount = useMemo(() =>
    transactions.filter(t =>
      moment(t.createdAt).isSameOrAfter(lastMonth) && moment(t.createdAt).isBefore(currentMonth)
    ).length, [transactions]
  );
  
  const transactionTrend = useMemo(() => 
    calculateTrend(currentTransactionCount, lastTransactionCount), 
    [currentTransactionCount, lastTransactionCount, calculateTrend]
  );

  const currentPendingWithdrawals = useMemo(() =>
    transactions
      .filter(t => t.status === 'pending' && moment(t.createdAt).isSameOrAfter(currentMonth))
      .reduce((sum, t) => sum + (Number(t.paymentAmount) || 0), 0), [transactions]
  );
  
  const lastPendingWithdrawals = useMemo(() =>
    transactions
      .filter(t => t.status === 'pending' && moment(t.createdAt).isSameOrAfter(lastMonth) && moment(t.createdAt).isBefore(currentMonth))
      .reduce((sum, t) => sum + (Number(t.paymentAmount) || 0), 0), [transactions]
  );
  
  const pendingWithdrawalsTrend = useMemo(() =>
    calculateTrend(currentPendingWithdrawals, lastPendingWithdrawals), 
    [currentPendingWithdrawals, lastPendingWithdrawals, calculateTrend]
  );

  const recentActivities = useMemo(() => {
    if (!transactions.length) return [];
    return transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(t => ({
        text: `Transaction ${t.status} (${t.paymentAmount ? `₦${Number(t.paymentAmount).toLocaleString()}` : 'N/A'})`,
        time: moment(t.createdAt).tz('Africa/Lagos').fromNow(),
        type: t.status,
      }));
  }, [transactions]);

  // Memoize chart data
  const lineChartData = useMemo(() => {
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
      datasets: [{
        label: 'Completed Transaction Amounts (₦)',
        data,
        borderColor: '#B38939',
        backgroundColor: 'rgba(187, 149, 61, 0.2)',
        fill: true,
        tension: 0.4,
      }],
    };
  }, [transactions]);

  const pieChartData = useMemo(() => ({
    labels: Object.keys(transactionStats),
    datasets: [{
      data: Object.values(transactionStats),
      backgroundColor: ['#B38939', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      hoverOffset: 8,
    }],
  }), [transactionStats]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#1A202C', font: { family: 'Bricolage Grotesque', size: 12, weight: 400 } },
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
        ticks: { color: '#1A202C', callback: (value) => `₦${value.toLocaleString()}` },
        grid: { color: '#E2E8F0' },
      },
      x: { ticks: { color: '#1A202C' }, grid: { display: false } },
    },
  }), []);

  const StatCard = ({ title, value, trend, icon: Icon, description, gradient }) => (
    <div className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-md group-hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trend.includes('↗') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            trend.includes('↘') ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {trend.includes('↗') && <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />}
            {trend.includes('↘') && <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />}
            {trend}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 group-hover:text-[#B38939] transition-colors duration-300">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );

  const quickActions = [
    { text: 'Export Data', icon: ArrowDownTrayIcon, variant: 'primary' },
    { text: 'Send Notice', icon: BellIcon, variant: 'secondary' },
    { text: 'View Reports', icon: ChartBarIcon, variant: 'outline' },
    { text: 'Settings', icon: CogIcon, variant: 'ghost' },
  ];

  const overviewCards = [
    { label: 'Completed Transactions', value: transactions.length, color: 'from-[#B38939] to-[#D4AF37]' },
    { label: 'Total Amount', value: `₦${totalCompletedAmount.toLocaleString()}`, color: 'from-gray-700 to-gray-900' },
    { label: 'Average Amount', value: `₦${averageCompletedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: 'from-blue-500 to-blue-600' },
    { label: 'All Transactions', value: stats?.transactionCount?.toLocaleString() || '0', color: 'from-purple-500 to-purple-600' }
  ];

  if (!stats && !error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 w-full overflow-x-hidden font-['Bricolage_Grotesque']">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 transition-all duration-500 ${isCollapsed ? SIDEBAR_CONFIG.collapsed.margin : SIDEBAR_CONFIG.expanded.margin} flex items-center justify-center`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B38939] mx-auto mb-4"></div>
            <div className="text-gray-500">Loading dashboard data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 w-full overflow-x-hidden font-['Bricolage_Grotesque']">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* Updated with correct margins that match exact sidebar widths */}
      <div className={`flex-1 transition-all duration-500 ${isCollapsed ? SIDEBAR_CONFIG.collapsed.margin : SIDEBAR_CONFIG.expanded.margin} p-3 lg:p-6`}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-3 lg:mb-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#B38939] via-[#D4AF37] to-[#B38939] bg-clip-text text-transparent mb-1">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 flex items-center text-sm">
                <BoltIcon className="w-3 h-3 mr-2 text-[#B38939]" />
                Real-time insights and analytics
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-xs text-gray-500">Last updated</p>
                <p className="text-xs font-semibold text-gray-700">{moment().tz('Africa/Lagos').format('MMM DD, YYYY HH:mm')}</p>
              </div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-md"></div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-r-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Error occurred</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {stats && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Users"
                  value={stats.userCount?.toLocaleString() || '0'}
                  trend={calculateTrend(stats.userCount, stats.userCountLastMonth)}
                  icon={UserGroupIcon}
                  description="Active platform users"
                  gradient="from-[#B38939] to-[#D4AF37]"
                />
                <StatCard
                  title="Transactions"
                  value={stats.transactionCount?.toLocaleString() || '0'}
                  trend={transactionTrend}
                  icon={CreditCardIcon}
                  description="All transaction records"
                  gradient="from-blue-500 to-blue-600"
                />
                <StatCard
                  title="Pending KYC"
                  value={stats.pendingKYC || '0'}
                  trend={calculateTrend(stats.pendingKYC, stats.pendingKYCLastMonth)}
                  icon={DocumentTextIcon}
                  description="Awaiting verification"
                  gradient="from-amber-500 to-orange-500"
                />
                <StatCard
                  title="Pending Withdrawals"
                  value={`₦${stats.pendingWithdrawals?.toLocaleString() || '0'}`}
                  trend={pendingWithdrawalsTrend}
                  icon={CurrencyDollarIcon}
                  description="Awaiting processing"
                  gradient="from-emerald-500 to-teal-500"
                />
              </div>

              {/* Transaction Overview */}
              {(transactions.length > 0 || Object.keys(transactionStats).length > 0) && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <ChartBarIcon className="w-5 h-5 mr-2 text-[#B38939]" />
                      Transaction Overview
                    </h2>
                    <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                      Last 6 months data
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {overviewCards.map((item, index) => (
                      <div key={index} className={`bg-gradient-to-br ${item.color} p-4 rounded-xl text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
                        <div className="text-xs opacity-90 mb-1.5 font-medium">{item.label}</div>
                        <div className="text-xl font-bold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Charts Section */}
              {(transactions.length > 0 || Object.keys(transactionStats).length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {transactions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <ArrowTrendingUpIcon className="w-4 h-4 mr-2 text-[#B38939]" />
                        Revenue Trend
                      </h3>
                      <div className="h-64">
                        <Line data={lineChartData} options={chartOptions} />
                      </div>
                    </div>
                  )}
                  
                  {Object.keys(transactionStats).length > 0 && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <BoltIcon className="w-4 h-4 mr-2 text-[#B38939]" />
                        Status Distribution
                      </h3>
                      <div className="h-64">
                        <Doughnut data={pieChartData} options={chartOptions} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <BoltIcon className="w-4 h-4 mr-2 text-[#B38939]" />
                      Recent Activity
                    </h3>
                    <button className="text-xs text-[#B38939] hover:text-[#D4AF37] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#B38939]/5 transition-all duration-200">
                      View All
                    </button>
                  </div>
                  
                  {recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg hover:from-[#B38939]/5 hover:to-transparent transition-all duration-200">
                          <div className={`w-2 h-2 rounded-full mr-3 animate-pulse ${
                            activity.type === 'completed' ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' :
                            activity.type === 'pending' ? 'bg-amber-500 shadow-md shadow-amber-500/30' :
                            activity.type === 'failed' ? 'bg-red-500 shadow-md shadow-red-500/30' :
                            'bg-blue-500 shadow-md shadow-blue-500/30'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-gray-700 font-medium text-sm">{activity.text}</p>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {activity.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-6">No recent transactions available.</p>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <CogIcon className="w-4 h-4 mr-2 text-[#B38939]" />
                    Quick Actions
                  </h3>
                  
                  <div className="space-y-3">
                    {quickActions.map((button, index) => (
                      <button
                        key={index}
                        className={`w-full flex items-center p-3 rounded-lg text-xs font-semibold transition-all duration-300 ${
                          button.variant === 'primary' ? 'bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white shadow-md hover:shadow-lg hover:scale-[1.02]' :
                          button.variant === 'secondary' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md hover:shadow-lg hover:scale-[1.02]' :
                          button.variant === 'outline' ? 'border border-[#B38939] text-[#B38939] hover:bg-[#B38939] hover:text-white hover:scale-[1.02]' :
                          'text-gray-600 hover:bg-gray-50 hover:text-[#B38939] hover:scale-[1.02]'
                        }`}
                      >
                        <button.icon className="w-4 h-4 mr-2" />
                        {button.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* No Transaction Data State */}
              {(transactions.length === 0 && Object.keys(transactionStats).length === 0) && (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="text-gray-400 text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-[#1A202C] mb-2">No Transaction Data</h3>
                  <p className="text-gray-500">Transaction charts will appear here once data is available.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;