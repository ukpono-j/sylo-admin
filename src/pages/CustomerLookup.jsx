import { useState, useCallback } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, BanknotesIcon, WalletIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, LockClosedIcon, ClockIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

const CustomerLookup = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [email, setEmail] = useState('');
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const safeFormat = (value) => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };

    const searchCustomer = useCallback(async () => {
        if (!email.trim()) return;
        setLoading(true);
        setError('');
        setCustomer(null);

        try {
            const res = await axiosInstance.get(`/api/admin/customer/${encodeURIComponent(email)}`);
            setCustomer(res.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Customer not found or server error');
        } finally {
            setLoading(false);
        }
    }, [email]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') searchCustomer();
    };

    const getColorClasses = (color) => {
        const colorMap = {
            emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            red: 'bg-gradient-to-br from-red-500 to-red-600',
            blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
            purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
            orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
            gold: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
            cyan: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
            amber: 'bg-gradient-to-br from-amber-500 to-amber-600',
        };
        return colorMap[color] || 'bg-gradient-to-br from-gray-500 to-gray-600';
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-['Bricolage_Grotesque']">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-[90px]' : 'lg:ml-[280px]'} p-6`}>
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B38939] to-[#D4AF37] bg-clip-text text-transparent">
                            Customer Financial Lookup
                        </h1>
                        <p className="text-gray-600 mt-2">Complete wallet activity and locked funds analysis</p>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div className="flex gap-4 max-w-2xl mx-auto">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Enter customer email address..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full pl-12 pr-6 py-4 rounded-xl border border-gray-300 focus:ring-4 focus:ring-[#B38939]/20 focus:border-[#B38939] outline-none text-lg"
                                />
                            </div>
                            <button
                                onClick={searchCustomer}
                                disabled={loading || !email}
                                className="px-8 py-4 bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white font-semibold rounded-xl hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {loading ? 'Searching...' : 'Search Customer'}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    {customer && (
                        <div className="mt-10 space-y-8">
                            {/* Customer Info + Alerts */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Customer Profile */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                        <div className="flex flex-col items-center text-center">
                                            {/* <img
                                                src={customer.user.avatarImage}
                                                alt={`${customer.user.firstName} ${customer.user.lastName}`}
                                                className="w-28 h-28 rounded-full shadow-xl border-4 border-[#B38939]/20"
                                            /> */}
                                            <img
                                            src={customer.user.avatarImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${customer.user.firstName} ${customer.user.lastName}`)}&background=B38939&color=fff&size=128`}
                                            alt={`${customer.user.firstName} ${customer.user.lastName}`}
                                            className="w-28 h-28 rounded-full shadow-xl border-4 border-[#B38939]/20 object-cover"
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${customer.user.firstName} ${customer.user.lastName}`)}&background=B38939&color=fff&size=128`;
                                            }}
                                        />
                                            <h2 className="mt-6 text-2xl font-bold text-gray-900">
                                                {customer.user.firstName} {customer.user.lastName}
                                            </h2>
                                            <p className="text-gray-500 text-sm mt-1">{customer.user.email}</p>
                                            <p className="text-sm text-gray-400 mt-1">{customer.user.phoneNumber}</p>
                                            <p className="text-xs text-gray-400 mt-4">
                                                Joined {new Date(customer.user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Alert Cards */}
                                <div className="lg:col-span-3 space-y-4">
                                    {/* Balance Mismatch Alert */}
                                    {safeFormat(customer.financials.balanceMismatch) !== 0 && (
                                        <div className="bg-red-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
                                            <div className="flex items-center gap-3">
                                                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-red-800 text-lg">Balance Mismatch Detected</h3>
                                                    <p className="text-red-700 text-sm mt-1">Current: ₦{safeFormat(customer.financials.currentBalance).toLocaleString()} | Expected: ₦{safeFormat(customer.financials.theoreticalBalance).toLocaleString()} | Difference: ₦{safeFormat(customer.financials.balanceMismatch).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Locked Funds Alert */}
                                    {safeFormat(customer.financials.lockedFunds?.totalLockedAmount) > 0 && (
                                        <div className="bg-amber-50 rounded-2xl shadow-lg p-6 border-2 border-amber-200">
                                            <div className="flex items-center gap-3">
                                                <LockClosedIcon className="w-8 h-8 text-amber-600" />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-amber-800 text-lg">Funds Locked in Active Transactions</h3>
                                                    <p className="text-amber-700 text-sm mt-1">
                                                        ₦{safeFormat(customer.financials.lockedFunds.totalLockedAmount).toLocaleString()} locked as buyer |
                                                        ₦{safeFormat(customer.financials.lockedFunds.totalAwaitingPayout).toLocaleString()} awaiting payout as seller
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pending Transactions Info */}
                                    {(customer.financials.totalBuyerTransactions > customer.financials.completedBuyerTransactions ||
                                        customer.financials.totalSellerTransactions > customer.financials.completedSellerTransactions) && (
                                            <div className="bg-blue-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
                                                <div className="flex items-center gap-3">
                                                    <ClockIcon className="w-8 h-8 text-blue-600" />
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <h3 className="font-bold text-blue-800">As Buyer</h3>
                                                            <p className="text-blue-700 text-sm">{customer.financials.completedBuyerTransactions} of {customer.financials.totalBuyerTransactions} completed</p>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-blue-800">As Seller</h3>
                                                            <p className="text-blue-700 text-sm">{customer.financials.completedSellerTransactions} of {customer.financials.totalSellerTransactions} completed</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Financial Overview */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                                    <WalletIcon className="w-6 h-6 text-[#B38939]" />
                                    Wallet Financial Summary
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        {
                                            label: 'Total Deposited',
                                            value: customer.financials.totalDeposited,
                                            icon: ArrowDownTrayIcon,
                                            color: 'emerald',
                                            tooltip: 'Direct Paystack top-ups only'
                                        },
                                        {
                                            label: 'Earned as Seller',
                                            value: customer.financials.totalEarnedAsSeller,
                                            icon: ArrowDownTrayIcon,
                                            color: 'blue',
                                            tooltip: 'Completed P2P sales only',
                                            subtext: `${customer.financials.completedSellerTransactions} completed`
                                        },
                                        {
                                            label: 'Spent as Buyer (Total)',
                                            value: customer.financials.totalSpentAsBuyer,
                                            icon: ArrowUpTrayIcon,
                                            color: 'red',
                                            tooltip: 'All wallet withdrawals for P2P (includes pending)',
                                            subtext: `${customer.financials.completedBuyerTransactions} of ${customer.financials.totalBuyerTransactions} completed`
                                        },
                                        {
                                            label: 'Locked in Active Transactions',
                                            value: customer.financials.lockedFunds?.totalLockedAmount || 0,
                                            icon: LockClosedIcon,
                                            color: 'amber',
                                            tooltip: 'Money locked in FUNDED/disputed transactions only (NOT pending)',
                                            subtext: `${(customer.financials.lockedFunds?.fundedBuyerCount || 0) + (customer.financials.lockedFunds?.disputedBuyerCount || 0)} funded transaction${((customer.financials.lockedFunds?.fundedBuyerCount || 0) + (customer.financials.lockedFunds?.disputedBuyerCount || 0)) !== 1 ? 's' : ''}`
                                        },
                                        {
                                            label: 'Withdrawn to Bank',
                                            value: customer.financials.totalWithdrawn,
                                            icon: BanknotesIcon,
                                            color: 'purple',
                                            validation: customer.financials.withdrawalsValidation?.filter(w => w.status === 'paid'),
                                            tooltip: 'Money sent to bank account'
                                        },
                                        {
                                            label: 'Current Balance',
                                            value: customer.financials.currentBalance,
                                            icon: WalletIcon,
                                            color: 'gold',
                                            big: true,
                                            tooltip: 'Total wallet balance',
                                            subtext: `Available: ₦${safeFormat(customer.financials.availableBalance).toLocaleString()}`
                                        },
                                        {
                                            label: 'Pending Withdrawals',
                                            value: customer.financials.totalPendingWithdrawals,
                                            icon: ClockIcon,
                                            color: 'orange',
                                            tooltip: 'Withdrawal requests awaiting processing'
                                        },
                                    ].map((item, i) => {
                                        const Icon = item.icon;
                                        const hasInvalidWithdrawals = item.validation?.some(w => !w.isValid);
                                        const displayValue = safeFormat(item.value);

                                        return (
                                            <div key={i} className={`bg-white rounded-2xl p-6 border ${item.big ? 'border-[#B38939] ring-2 ring-[#B38939]/20' : 'border-gray-200'} shadow-md hover:shadow-xl transition-all`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                                            {item.label}
                                                            {item.tooltip && (
                                                                <span className="relative group/tooltip">
                                                                    <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                                                                    <span className="absolute hidden group-hover/tooltip:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg whitespace-nowrap z-10">
                                                                        {item.tooltip}
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className={`text-2xl font-bold mt-2 ${item.big ? 'text-[#B38939]' : 'text-gray-900'}`}>
                                                            ₦{displayValue.toLocaleString()}
                                                        </p>
                                                        {item.subtext && <p className="text-xs text-gray-500 mt-1">{item.subtext}</p>}

                                                        {item.validation && (
                                                            <div className="mt-2 flex items-center gap-1">
                                                                {hasInvalidWithdrawals ? (
                                                                    <>
                                                                        <XCircleIcon className="w-4 h-4 text-red-500" />
                                                                        <span className="text-xs text-red-600 font-semibold">Invalid detected</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                                                        <span className="text-xs text-green-600 font-semibold">All valid</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={getColorClasses(item.color) + ' p-3 rounded-xl'}>
                                                        <Icon className="w-7 h-7 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Locked Funds Breakdown */}
                            {customer.financials.lockedFunds && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                                        <LockClosedIcon className="w-6 h-6 text-amber-600" />
                                        Locked Funds in Active Transactions
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            {
                                                label: 'Funded Buyer (Escrow)',
                                                amount: customer.financials.lockedFunds.fundedBuyerAmount,
                                                count: customer.financials.lockedFunds.fundedBuyerCount,
                                                icon: LockClosedIcon,
                                                color: 'cyan',
                                                tooltip: 'Money locked in FUNDED buyer transactions only'
                                            },
                                            {
                                                label: 'Disputed as Buyer',
                                                amount: customer.financials.lockedFunds.disputedBuyerAmount,
                                                count: customer.financials.lockedFunds.disputedBuyerCount,
                                                icon: ShieldExclamationIcon,
                                                color: 'red',
                                                tooltip: 'Money locked in disputed buyer transactions'
                                            },
                                            {
                                                label: 'Awaiting Seller Payout',
                                                amount: customer.financials.lockedFunds.fundedSellerAmount,
                                                count: customer.financials.lockedFunds.fundedSellerCount,
                                                icon: ClockIcon,
                                                color: 'blue',
                                                tooltip: 'Money in FUNDED seller transactions (awaiting delivery & payout)'
                                            },
                                            {
                                                label: 'Disputed as Seller',
                                                amount: customer.financials.lockedFunds.disputedSellerAmount,
                                                count: customer.financials.lockedFunds.disputedSellerCount,
                                                icon: ShieldExclamationIcon,
                                                color: 'orange',
                                                tooltip: 'Money in disputed seller transactions'
                                            },
                                        ].map((item, i) => {
                                            const Icon = item.icon;
                                            const displayValue = safeFormat(item.amount);

                                            return (
                                                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                {item.label}
                                                                <span className="relative group/tooltip">
                                                                    <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                                                                    <span className="absolute hidden group-hover/tooltip:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg whitespace-nowrap z-10">
                                                                        {item.tooltip}
                                                                    </span>
                                                                </span>
                                                            </p>
                                                            <p className="text-2xl font-bold mt-2 text-gray-900">
                                                                ₦{displayValue.toLocaleString()}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">{item.count} transaction{item.count !== 1 ? 's' : ''}</p>
                                                        </div>
                                                        <div className={getColorClasses(item.color) + ' p-3 rounded-xl'}>
                                                            <Icon className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Withdrawal Details Table */}
                            {customer.financials.withdrawalsValidation && customer.financials.withdrawalsValidation.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                                    <h4 className="text-lg font-bold text-gray-800 mb-4">Bank Withdrawal Requests</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Reference</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Validation</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Balance at Request</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Breakdown</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {customer.financials.withdrawalsValidation.map((w, idx) => (
                                                    <tr key={idx} className={!w.isValid ? 'bg-red-50' : ''}>
                                                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{w.reference?.substring(0, 12) || 'N/A'}...</td>
                                                        <td className="px-4 py-3 text-gray-900 font-semibold">₦{safeFormat(w.amount).toLocaleString()}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${w.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                w.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {w.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {w.isValid ? (
                                                                <span className="flex items-center gap-1 text-green-600 font-semibold">
                                                                    <CheckCircleIcon className="w-4 h-4" />
                                                                    Valid
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-red-600 font-semibold">
                                                                    <XCircleIcon className="w-4 h-4" />
                                                                    Invalid
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700 font-semibold">₦{safeFormat(w.balanceAtRequestTime).toLocaleString()}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-xs space-y-1">
                                                                <div className="text-green-600">+₦{safeFormat(w.breakdown?.deposits).toLocaleString()} (deposits)</div>
                                                                <div className="text-blue-600">+₦{safeFormat(w.breakdown?.receivedAsSeller).toLocaleString()} (P2P in)</div>
                                                                <div className="text-red-600">-₦{safeFormat(w.breakdown?.paidAsBuyer).toLocaleString()} (P2P out)</div>
                                                                <div className="text-purple-600">-₦{safeFormat(w.breakdown?.previousWithdrawals).toLocaleString()} (prev withdrawals)</div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="text-xs text-gray-400 text-center">
                                Last updated: {new Date(customer.statsUpdatedAt).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerLookup;