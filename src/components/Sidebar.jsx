import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, CurrencyDollarIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import "./Sidebar.css";
import Logo from "../assets/logo1.png";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <button
        className="lg:hidden fixed top-4 right-4 z-60 p-3 bg-[#B38939] text-white rounded-xl shadow-xl hover:bg-[#BB954D] transition-all duration-300 hover:scale-[1.03]"
        onClick={toggleMobileSidebar}
      >
        {isMobileOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </button>

      <div
        className={`sidebar fixed top-0 left-0 pt-5 h-screen bg-gradient-to-b from-[#1A202C] via-[#051E2F] to-[#1A202C] text-white shadow-2xl transform transition-all duration-300 ease-in-out z-40 ${
          isMobileOpen ? 'translate-x-0 w-64 max-w-full' : '-translate-x-full w-64 max-w-full'
        } lg:translate-x-0 ${isCollapsed ? 'w-16 overflow-hidden' : 'w-72'}`}
      >
        <div className={`hidden lg:flex sidebar-header ${isCollapsed ? 'items-center justify-center p-2' : 'p-3'}`}>
          <div className="header-container relative w-full">
            {!isCollapsed && (
              <div className="logo-container expanded flex justify-start items-center mb-2 shadow-sm pl-4 overflow-hidden">
                <img src={Logo} alt="Sylo Admin Logo" className="max-w-[90px] h-auto object-contain hover:scale-[1.03] transition-all duration-200" />
              </div>
            )}
            <button
              className={`toggle-button p-2 bg-[#B38939]/20 text-[#B38939] rounded-lg hover:bg-[#B38939] hover:text-white transition-all duration-300 hover:scale-[1.03] border border-[#B38939]/30 ${
                isCollapsed ? 'w-full flex justify-center' : 'absolute top-0.5 right-0.5'
              }`}
              onClick={toggleDesktopSidebar}
            >
              {isCollapsed ? <Bars3Icon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="lg:hidden flex items-center justify-between px-4 py-2">
          <div className="logo-container flex justify-center items-center overflow-hidden">
            <img src={Logo} alt="Sylo Admin Logo" className="max-w-[90px] h-auto object-contain hover:scale-[1.03] transition-all duration-200" />
          </div>
        </div>

        {isCollapsed && (
          <div className="hidden lg:flex justify-center pb-2">
            <div className="logo-container w-7 h-7 flex items-center justify-center mx-auto overflow-hidden">
              <img src={Logo} alt="Sylo Admin Logo" className="max-w-[28px] h-auto object-contain rounded-lg hover:scale-[1.03] transition-all duration-200" />
            </div>
          </div>
        )}

        <div className={`flex flex-col h-full justify-between px-4 pb-6 ${isCollapsed ? 'sidebar-nav' : 'min-h-0'}`}>
          <div className={`nav-container ${isCollapsed ? 'max-h-[calc(100vh-80px)]' : 'max-h-[calc(100vh-144px)]'} flex-grow overflow-y-auto overflow-x-hidden`}>
            <div className="space-y-2 mt-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `group flex items-center rounded-2xl text-base font-medium transition-all duration-300 ${
                    isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-[#B38939] text-white shadow-lg transform scale-[1.03]'
                      : 'text-gray-300 hover:bg-[#B38939]/10 hover:text-[#BB954D]'
                  }`
                }
                title={isCollapsed ? 'Dashboard' : ''}
              >
                {({ isActive }) => (
                  <div className={`flex items-center w-full ${isCollapsed ? 'justify-center w-auto mx-auto' : 'justify-start'}`}>
                    <div className={`p-2 rounded-xl transition-colors duration-300 hover:scale-[1.03] ${
                      isActive ? 'bg-white/20' : 'bg-[#B38939]/20 group-hover:bg-[#B38939]/30'
                    }`}>
                      <HomeIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#BB954D]'}`} />
                    </div>
                    {!isCollapsed && (
                      <span className="ml-4 font-semibold">Dashboard</span>
                    )}
                  </div>
                )}
              </NavLink>

              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `group flex items-center rounded-2xl text-base font-medium transition-all duration-300 ${
                    isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-[#B38939] text-white shadow-lg transform scale-[1.03]'
                      : 'text-gray-300 hover:bg-[#B38939]/10 hover:text-[#BB954D]'
                  }`
                }
                title={isCollapsed ? 'Users' : ''}
              >
                {({ isActive }) => (
                  <div className={`flex items-center w-full ${isCollapsed ? 'justify-center w-auto mx-auto' : 'justify-start'}`}>
                    <div className={`p-2 rounded-xl transition-colors duration-300 hover:scale-[1.03] ${
                      isActive ? 'bg-white/20' : 'bg-[#B38939]/20 group-hover:bg-[#B38939]/30'
                    }`}>
                      <UserGroupIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#BB954D]'}`} />
                    </div>
                    {!isCollapsed && (
                      <span className="ml-4 font-semibold">Users</span>
                    )}
                  </div>
                )}
              </NavLink>

              <NavLink
                to="/transactions"
                className={({ isActive }) =>
                  `group flex items-center rounded-2xl text-base font-medium transition-all duration-300 ${
                    isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-[#B38939] text-white shadow-lg transform scale-[1.03]'
                      : 'text-gray-300 hover:bg-[#B38939]/10 hover:text-[#BB954D]'
                  }`
                }
                title={isCollapsed ? 'Transactions' : ''}
              >
                {({ isActive }) => (
                  <div className={`flex items-center w-full ${isCollapsed ? 'justify-center w-auto mx-auto' : 'justify-start'}`}>
                    <div className={`p-2 rounded-xl transition-colors duration-300 hover:scale-[1.03] ${
                      isActive ? 'bg-white/20' : 'bg-[#B38939]/20 group-hover:bg-[#B38939]/30'
                    }`}>
                      <CurrencyDollarIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#BB954D]'}`} />
                    </div>
                    {!isCollapsed && (
                      <span className="ml-4 font-semibold">Transactions</span>
                    )}
                  </div>
                )}
              </NavLink>

              <NavLink
                to="/withdrawals"
                className={({ isActive }) =>
                  `group flex items-center rounded-2xl text-base font-medium transition-all duration-300 ${
                    isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-[#B38939] text-white shadow-lg transform scale-[1.03]'
                      : 'text-gray-300 hover:bg-[#B38939]/10 hover:text-[#BB954D]'
                  }`
                }
                title={isCollapsed ? 'Withdrawals' : ''}
              >
                {({ isActive }) => (
                  <div className={`flex items-center w-full ${isCollapsed ? 'justify-center w-auto mx-auto' : 'justify-start'}`}>
                    <div className={`p-2 rounded-xl transition-colors duration-300 hover:scale-[1.03] ${
                      isActive ? 'bg-white/20' : 'bg-[#B38939]/20 group-hover:bg-[#B38939]/30'
                    }`}>
                      <BanknotesIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#BB954D]'}`} />
                    </div>
                    {!isCollapsed && (
                      <span className="ml-4 font-semibold">Withdrawals</span>
                    )}
                  </div>
                )}
              </NavLink>
            </div>
          </div>

          <div className={`footer border-t border-[#B38939]/20 ${isCollapsed ? 'absolute bottom-0 w-full' : 'sticky bottom-0 pt-6 min-h-[48px] overflow-hidden'}`}>
            <button
              onClick={handleLogout}
              className={`group w-full flex items-center rounded-2xl text-base font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 min-h-[48px] z-50 ${
                isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
              }`}
              title={isCollapsed ? 'Logout' : ''}
            >
              <div className={`flex items-center w-full ${isCollapsed ? 'justify-center w-auto mx-auto' : 'justify-start'}`}>
                <div className="p-2 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors duration-300 hover:scale-[1.03]">
                  <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-400" />
                </div>
                {!isCollapsed && (
                  <span className="ml-4 font-semibold">Logout</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-30 transition-opacity duration-300"
          onClick={toggleMobileSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;