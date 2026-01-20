import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/database.service';
import type { UserProfile } from '../types';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const displayName = profile?.displayName || user?.displayName || 'Student';
  
  const years = [
    { id: 1, title: 'Year 1', subtitle: 'Licence 1 (L1)', level: 'L1', icon: 'menu_book', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 2, title: 'Year 2', subtitle: 'Licence 2 (L2)', level: 'L2', icon: 'code', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 3, title: 'Year 3', subtitle: 'Licence 3 (L3)', level: 'L3', icon: 'functions', color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 4, title: 'Master 1', subtitle: 'Research & Dev', level: 'M1', icon: 'science', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 5, title: 'Master 2', subtitle: 'Thesis & Grad', level: 'M2', icon: 'workspace_premium', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Welcome back, <span className="text-primary">{displayName}</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl">
          Academic Dashboard: Computer Science & Mathematics. Select your academic year below to access resources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {years.map((year) => (
          <Link 
            key={year.id} 
            to={`/dashboard?level=${year.level}`}
            className="group relative flex flex-col justify-between h-64 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute right-[-20px] top-[-20px] text-slate-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500 pointer-events-none">
               <span className="material-symbols-outlined text-[180px]">{year.icon}</span>
            </div>

            <div className="relative z-10 flex justify-between items-start">
              <div className={`size-14 rounded-xl ${year.bg} ${year.color} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-[32px]">{year.icon}</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_forward</span>
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-slate-900">{year.title}</h3>
              <p className="text-slate-500 mt-1">{year.subtitle}</p>
            </div>

            <div className="relative z-10 mt-auto pt-4">
               <div className="text-sm font-bold text-primary group-hover:underline flex items-center gap-1">
                 View Courses <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
               </div>
            </div>
          </Link>
        ))}

        {/* Library Card */}
        <div className="group relative flex flex-col justify-center items-center h-64 p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-white transition-all duration-300 cursor-pointer text-center gap-4">
           <div className="size-16 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[32px]">local_library</span>
           </div>
           <div>
             <h3 className="text-xl font-bold text-slate-900">Library Portal</h3>
             <p className="text-slate-500 text-sm mt-1">Access research papers</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Home;