import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../services/auth.service';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signIn(email, password);
      
      // Check if admin based on email
      const isAdmin = email.toLowerCase().startsWith('admin');
      
      if (isAdmin) {
        navigate('/admin/modules');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle Firebase auth errors
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-[400px] w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-white p-8 pb-6 text-center">
           <div className="size-12 bg-primary text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
               <span className="material-symbols-outlined text-3xl">school</span>
           </div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
           <p className="text-slate-500 text-sm mt-2">Sign in to your academic portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    <span>{error}</span>
                </div>
            )}
            
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@university.edu" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
                    />
                </div>
            </div>
            
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                    <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot?</a>
                </div>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <span>Signing in...</span>
                        <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                    </>
                ) : (
                    <>
                        <span>Secure Sign In</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                )}
            </button>
        </form>

        <div className="p-6 border-t border-slate-100 text-center bg-slate-50">
            <p className="text-sm text-slate-500">
                New student? <Link to="/signup" className="text-primary font-bold hover:underline">Create Account</Link>
            </p>
        </div>

      </div>
    </div>
  );
};

export default Login;