import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllSeries } from '../services/database.service';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [seriesCount, setSeriesCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, userProfile } = useAuth();

  const isAdminRoute = location.pathname.includes('admin');

  useEffect(() => {
    if (isAdmin) {
      fetchSeriesCount();
    }
  }, [isAdmin]);

  const fetchSeriesCount = async () => {
    try {
      const series = await getAllSeries();
      setSeriesCount(series.length);
    } catch (error) {
      console.error('Error fetching series count:', error);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className={`size-8 rounded-lg flex items-center justify-center text-white ${isAdminRoute ? 'bg-slate-900' : 'bg-primary'}`}>
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{isAdminRoute ? 'AdminPortal' : 'UniDash'}</h1>
              <p className="text-xs text-slate-500">{isAdminRoute ? 'Admin Access' : 'Student Portal'}</p>
            </div>
          </div>

          {/* User Snippet */}
          {!isAdminRoute && userProfile && (
            <div className="px-6 pb-6">
              <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-primary/30 transition-all cursor-pointer group">
                <div className="size-10 rounded-full bg-cover bg-center flex items-center justify-center bg-primary text-white font-bold" style={{ backgroundImage: userProfile.photoURL ? `url(${userProfile.photoURL})` : undefined }}>
                  {!userProfile.photoURL && (userProfile.displayName?.[0] || userProfile.email?.[0] || 'U').toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden flex-1">
                  <h2 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {userProfile.displayName || 'Student'}
                  </h2>
                  <p className="text-xs text-slate-500 truncate">
                    {userProfile.studentId || userProfile.email}
                  </p>
                </div>
              </Link>
              
              {/* Additional Info */}
              {(userProfile.phone || userProfile.address) && (
                <div className="mt-3 px-3 space-y-2">
                  {userProfile.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="material-symbols-outlined text-[14px]">phone</span>
                      <span className="truncate">{userProfile.phone}</span>
                    </div>
                  )}
                  {userProfile.address && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span className="truncate">{userProfile.address}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 space-y-1">
            <div className="px-2 mb-2 mt-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Menu</span>
            </div>
            
            <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive && !location.pathname.includes('admin') ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span className="material-symbols-outlined">home</span>
              <span className="text-sm">Home</span>
            </NavLink>

            <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm">Year Dashboard</span>
            </NavLink>
            
            <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span className="material-symbols-outlined">person</span>
              <span className="text-sm">My Profile</span>
            </NavLink>

            {isAdmin && (
              <>
                <div className="px-2 mb-2 mt-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</span>
                </div>

                <NavLink to="/admin/modules" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-slate-800 text-white font-medium shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-symbols-outlined">library_books</span>
                  <span className="text-sm">Manage Modules</span>
                </NavLink>

                <NavLink to="/admin/chapters" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-slate-800 text-white font-medium shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-symbols-outlined">menu_book</span>
                  <span className="text-sm">Manage Chapters</span>
                </NavLink>

                <NavLink to="/admin/series" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-slate-800 text-white font-medium shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-symbols-outlined">assignment</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">Manage Series (TD/TP/Exam)</span>
                    {seriesCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                        {seriesCount}
                      </span>
                    )}
                  </div>
                </NavLink>

                <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-slate-800 text-white font-medium shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-symbols-outlined">group</span>
                  <span className="text-sm">Manage Users</span>
                </NavLink>

                <NavLink to="/admin/exam-settings" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-slate-800 text-white font-medium shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-symbols-outlined">schedule</span>
                  <span className="text-sm">Exam Settings</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200">
             <button onClick={() => navigate('/login')} className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-500">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="hidden md:flex relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <Link 
              to="/profile" 
              className="size-9 rounded-full bg-cover bg-center border border-slate-200 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all flex items-center justify-center bg-primary text-white font-bold text-sm"
              style={{ backgroundImage: userProfile?.photoURL ? `url(${userProfile.photoURL})` : undefined }}
            >
              {!userProfile?.photoURL && (userProfile?.displayName?.[0] || userProfile?.email?.[0] || 'U').toUpperCase()}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;