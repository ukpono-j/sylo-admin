import { useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, CurrencyDollarIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, Bars3Icon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import "./Sidebar.css";
import Logo from "../assets/logo1.png";
import { debounce } from 'lodash';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Debounced logout function to prevent multiple rapid triggers
  const handleLogout = useCallback(
    debounce(() => {
      localStorage.removeItem('adminToken');
      navigate('/login');
    }, 300),
    [navigate]
  );

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, [setIsCollapsed]);

  return (
    <>
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-[#B38939] text-white rounded-xl shadow-xl hover:bg-[#BB954D] transition-colors duration-200"
        onClick={toggleMobileSidebar}
      >
        {isMobileOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </button>

      <div
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-[#1A202C] via-[#051E2F] to-[#1A202C] text-white shadow-2xl transition-all duration-300 ease-in-out z-40 ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
        } lg:translate-x-0 ${isCollapsed ? 'w-[88px]' : 'w-[250px]'}`}
      >
        <div className={`hidden lg:flex items-center ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}>
          <div className="relative w-full">
            {!isCollapsed && (
              <div className="flex justify-start items-center mb-2 pl-4">
                <img src={Logo} alt="Sylo Admin Logo" className="max-w-[90px] h-auto object-contain transition-transform duration-200" />
              </div>
            )}
            <button
              className={`p-2 bg-[#B38939]/20 text-[#B38939] rounded-lg hover:bg-[#B38939] hover:text-white transition-colors duration-200 ${
                isCollapsed ? 'w-full flex justify-center' : 'absolute top-0.5 right-0.5'
              }`}
              onClick={toggleDesktopSidebar}
            >
              {isCollapsed ? <Bars3Icon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="lg:hidden flex items-center justify-center px-4 py-2">
          <img src={Logo} alt="Sylo Admin Logo" className="max-w-[90px] h-auto object-contain transition-transform duration-200" />
        </div>

        {isCollapsed && (
          <div className="hidden lg:flex justify-center pb-2">
            <img src={Logo} alt="Sylo Admin Logo" className="max-w-[28px] h-auto object-contain rounded-lg transition-transform duration-200" />
          </div>
        )}

        <div className={`flex flex-col justify-between px-4 pb-6 ${isCollapsed ? 'items-center' : ''}`}>
          <div className="space-y-2 mt-4 flex-grow overflow-y-auto overflow-x-hidden">
            {[
              { to: '/', icon: HomeIcon, label: 'Dashboard' },
              { to: '/users', icon: UserGroupIcon, label: 'Users' },
              { to: '/transactions', icon: CurrencyDollarIcon, label: 'Transactions' },
              { to: '/disputes', icon: ChatBubbleLeftRightIcon, label: 'Disputes' },
              { to: '/withdrawals', icon: BanknotesIcon, label: 'Withdrawals' },
            ].map(({ to, icon: Icon, label }, index) => (
              <NavLink
                key={index}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center rounded-2xl text-base font-medium transition-colors duration-200 ${
                    isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-[#B38939] text-white shadow-lg'
                      : 'text-gray-300 hover:bg-[#B38939]/10 hover:text-[#BB954D]'
                  }`
                }
                title={isCollapsed ? label : ''}
              >
                {({ isActive }) => (
                  <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                    <div className={`p-2 rounded-xl transition-colors duration-200 ${
                      isActive ? 'bg-white/20' : 'bg-[#B38939]/20 group-hover:bg-[#B38939]/30'
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#BB954D]'}`} />
                    </div>
                    {!isCollapsed && (
                      <span className="ml-4 font-semibold">{label}</span>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </div>

          <div className="border-t absolute bottom-6 border-[#B38939]/20 pt-6">
            <button
              onClick={handleLogout}
              className={`group w-full flex items-center rounded-2xl text-base font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200 ${
                isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
              }`}
              title={isCollapsed ? 'Logout' : ''}
            >
              <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                <div className="p-2 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors duration-200">
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
          className="lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-300"
          onClick={toggleMobileSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;