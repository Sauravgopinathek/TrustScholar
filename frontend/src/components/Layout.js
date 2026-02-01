import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { 
  FiHome, FiAward, FiFileText, FiUsers, FiSettings, 
  FiLogOut, FiShield, FiMenu, FiX 
} from 'react-icons/fi';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = {
    student: [
      { name: 'Scholarships', href: '/app/scholarships', icon: FiAward },
      { name: 'My Applications', href: '/app/my-applications', icon: FiFileText },
    ],
    officer: [
      { name: 'Review Applications', href: '/app/review-applications', icon: FiFileText },
      { name: 'Scholarships', href: '/app/scholarships', icon: FiAward },
    ],
    admin: [
      { name: 'Users', href: '/app/admin/users', icon: FiUsers },
      { name: 'Audit Logs', href: '/app/admin/audit-logs', icon: FiShield },
    ],
  };

  const navItems = navigation[user?.role] || navigation.student;

  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('This will permanently delete your account and data. Continue?');
    if (!confirmed) return;

    try {
      await usersAPI.deleteMe();
      await logout();
      window.location.href = '/login';
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600">
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <span className="font-semibold text-primary-700">TrustScholar</span>
        <div className="w-6"></div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-900 via-primary-900 to-slate-900 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">TrustScholar</h1>
                <p className="text-gray-400 text-xs">Secure Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-500/30' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="px-4 py-3 bg-white/5 rounded-xl mb-3 border border-white/10">
              <p className="text-white font-medium truncate">{user?.full_name || user?.fullName}</p>
              <p className="text-gray-400 text-sm truncate">{user?.email}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 text-xs rounded-lg border border-emerald-500/30 capitalize">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors"
            >
              <FiLogOut size={20} />
              Logout
            </button>
            <button
              onClick={handleDeleteAccount}
              className="mt-2 flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
            >
              <FiSettings size={20} />
              Delete Account
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
