import { useState, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, CurrencyDollarIcon, BanknotesIcon,MagnifyingGlassIcon, ArrowLeftOnRectangleIcon, Bars3Icon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

// Sidebar configuration for consistent dimensions
const SIDEBAR_CONFIG = {
  expanded: {
    width: 'w-[280px]',
    widthPx: 280
  },
  collapsed: {
    width: 'w-[90px]',
    widthPx: 90
  },
  mobile: {
    width: 'w-72',
    widthPx: 288
  }
};

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Navigation items with proper routing
  const navigationItems = [
    { to: '/', icon: HomeIcon, label: 'Dashboard' },
    { to: '/users', icon: UserGroupIcon, label: 'Users' },
    { to: '/transactions', icon: CurrencyDollarIcon, label: 'Transactions' },
    { to: '/disputes', icon: ChatBubbleLeftRightIcon, label: 'Disputes' },
    { to: '/withdrawals', icon: BanknotesIcon, label: 'Withdrawals' },
    { to: '/customer-lookup', icon: MagnifyingGlassIcon, label: 'Customer Lookup' },
  ];

  // Check if route is active
  const isActiveRoute = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    // Simulated logout for demo
    console.log('Logout triggered');
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, [setIsCollapsed]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-6 right-6 z-50 p-3.5 bg-gradient-to-br from-[#B38939] to-[#9B7429] text-white rounded-2xl shadow-2xl hover:shadow-[#B38939]/25 hover:scale-105 transition-all duration-300 border border-[#D4AF37]/20"
        onClick={toggleMobileSidebar}
      >
        {isMobileOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-[#0F1419] via-[#1A202C] via-[#051E2F] to-[#0A0E14] text-white shadow-2xl transition-all duration-500 ease-in-out z-40 border-r border-[#B38939]/10 backdrop-blur-sm flex flex-col ${
          isMobileOpen ? `translate-x-0 ${SIDEBAR_CONFIG.mobile.width}` : `-translate-x-full ${SIDEBAR_CONFIG.mobile.width}`
        } lg:translate-x-0 ${isCollapsed ? SIDEBAR_CONFIG.collapsed.width : SIDEBAR_CONFIG.expanded.width}`}
      >
        {/* Header Section - Fixed at top */}
        <div className={`flex-shrink-0 relative ${isCollapsed ? 'p-3' : 'p-4'} border-b border-[#B38939]/10`}>
          {!isCollapsed && (
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-[#B38939] to-[#D4AF37] bg-clip-text text-transparent">
                    Sylo Admin
                  </h1>
                  <p className="text-xs text-gray-400">Management Portal</p>
                </div>
              </div>
              <button
                className="p-1.5 bg-[#B38939]/10 text-[#B38939] rounded-lg hover:bg-[#B38939]/20 hover:rotate-90 transition-all duration-300 border border-[#B38939]/20"
                onClick={toggleDesktopSidebar}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#B38939] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <button
                className="p-1.5 bg-[#B38939]/10 text-[#B38939] rounded-lg hover:bg-[#B38939]/20 hover:rotate-90 transition-all duration-300 border border-[#B38939]/20"
                onClick={toggleDesktopSidebar}
              >
                <Bars3Icon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Section - Scrollable middle section */}
        <div className="flex-1 overflow-y-auto">
          <nav className={`${isCollapsed ? 'px-3 py-4' : 'px-4 py-5'} space-y-2`}>
            {navigationItems.map(({ to, icon: Icon, label }, index) => {
              const isActive = isActiveRoute(to);
              return (
                <NavLink
                  key={index}
                  to={to}
                  onClick={() => setIsMobileOpen(false)} // Close mobile menu on navigation
                  className={`group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                    isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#B38939] to-[#D4AF37] text-white shadow-lg shadow-[#B38939]/15 border border-[#B38939]/20'
                      : 'text-gray-300 hover:bg-gradient-to-r hover:from-[#B38939]/10 hover:to-[#D4AF37]/10 hover:text-[#D4AF37] hover:shadow-md hover:border hover:border-[#B38939]/15 rounded-xl'
                  }`}
                  title={isCollapsed ? label : ''}
                >
                  <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                    <div className={`relative p-2 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/15 shadow-inner' 
                        : 'bg-[#B38939]/10 group-hover:bg-[#B38939]/20 group-hover:scale-105'
                    }`}>
                      <Icon className={`w-4 h-4 transition-all duration-300 ${
                        isActive ? 'text-white' : 'text-[#B38939] group-hover:text-[#D4AF37]'
                      }`} />
                    </div>
                    {!isCollapsed && (
                      <span className={`ml-3 font-medium transition-all duration-300 ${
                        isActive ? 'text-white' : 'group-hover:translate-x-1'
                      }`}>
                        {label}
                      </span>
                    )}
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && !isCollapsed && (
                    <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-md"></div>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A202C] text-white text-xs rounded-md shadow-lg border border-[#B38939]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                      {label}
                      <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-2 border-b-2 border-r-2 border-transparent border-r-[#1A202C]"></div>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer/System Status & Logout Section - Fixed at bottom */}
        <div className={`flex-shrink-0 border-t border-[#B38939]/15 ${isCollapsed ? 'p-3' : 'p-4'}`}>
          {/* System Status - Always visible */}
          {!isCollapsed && (
            <div className="w-full text-center pb-3 mb-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#B38939]/10 rounded-lg border border-[#B38939]/15">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-300">System Online</span>
              </div>
            </div>
          )}
          
          {/* System Status for collapsed state */}
          {isCollapsed && (
            <div className="flex justify-center pb-3 mb-3">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          )}
          
          {/* Logout Button - Always visible at bottom */}
          <button
            onClick={handleLogout}
            className={`group w-full flex items-center rounded-xl text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 hover:text-red-400 hover:shadow-md hover:border hover:border-red-500/15 transition-all duration-300 ${
              isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 group-hover:scale-105 transition-all duration-300">
                <ArrowLeftOnRectangleIcon className="w-4 h-4 text-red-400 group-hover:text-red-300" />
              </div>
              {!isCollapsed && (
                <span className="ml-3 font-medium group-hover:translate-x-1 transition-all duration-300">
                  Logout
                </span>
              )}
            </div>
            
            {/* Tooltip for collapsed logout */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A202C] text-white text-xs rounded-md shadow-lg border border-red-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                Logout
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-2 border-b-2 border-r-2 border-transparent border-r-[#1A202C]"></div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={toggleMobileSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;