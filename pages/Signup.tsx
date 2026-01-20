import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../services/auth.service';
import { createUserProfile } from '../services/database.service';

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Additional Info
  const [userId, setUserId] = useState('');
  
  // Step 1 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  
  // Step 2 fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  
  // Location autocomplete
  const [addressQuery, setAddressQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Location autocomplete with debounce
  useEffect(() => {
    if (step !== 2 || addressQuery.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=5`,
          { headers: { 'User-Agent': 'UniDash-App' } }
        );
        const data = await response.json();
        setLocationSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      } finally {
        setSearchingLocation(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [addressQuery, step]);

  const selectLocation = (location: LocationSuggestion) => {
    setAddressQuery(location.display_name);
    setAddress(location.display_name);
    setShowSuggestions(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const displayName = `${firstName} ${lastName}`;
      const userCredential = await signUp(email, password, displayName);
      
      // Store user ID and move to step 2
      setUserId(userCredential.uid);
      setStep(2);
    } catch (err: any) {
      console.error('Signup error:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Create user profile with all information
      const now = new Date().toISOString();
      await createUserProfile(userId, {
        email,
        displayName: `${firstName} ${lastName}`,
        studentId,
        phone: phone || undefined,
        address: address || undefined,
        major: major || undefined,
        year: year || undefined,
        role: 'student',
        createdAt: now,
        updatedAt: now,
      });
      
      navigate('/');
    } catch (err: any) {
      console.error('Profile creation error:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      // Create minimal profile
      const now = new Date().toISOString();
      await createUserProfile(userId, {
        email,
        displayName: `${firstName} ${lastName}`,
        studentId,
        role: 'student',
        createdAt: now,
        updatedAt: now,
      });
      
      navigate('/');
    } catch (err: any) {
      console.error('Profile creation error:', err);
      setError('Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-[500px] w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Step Indicator */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-slate-400'}`}>
              <div className={`size-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-primary text-white' : 'bg-slate-200'}`}>1</div>
              <span className="text-sm font-bold">Basic Info</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-3"></div>
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-slate-400'}`}>
              <div className={`size-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-primary text-white' : 'bg-slate-200'}`}>2</div>
              <span className="text-sm font-bold">Details</span>
            </div>
          </div>
        </div>

        <div className="px-8 pb-4 text-center">
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">
             {step === 1 ? 'Create Account' : 'Complete Your Profile'}
           </h1>
           <p className="text-slate-500 text-sm mt-2">
             {step === 1 ? 'Join UniDash to access your courses' : 'Help us personalize your experience'}
           </p>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <form onSubmit={handleSignup} className="p-8 pt-4 space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    <span>{error}</span>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                    <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                        required 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                    <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                        required 
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">University Email</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                    required 
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                    required 
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Student ID</label>
                <input 
                    type="text" 
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 2024001" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                    required 
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Creating Account...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Additional Info */}
        {step === 2 && (
          <form onSubmit={handleCompleteProfile} className="p-8 pt-4 space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number (Optional)</label>
                <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +213 555 123 456"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                />
            </div>

            <div className="space-y-1 relative">
                <label className="text-xs font-bold text-slate-500 uppercase">Address (Optional)</label>
                <div className="relative">
                  <input 
                      type="text" 
                      value={addressQuery}
                      onChange={(e) => {
                        setAddressQuery(e.target.value);
                        setAddress(e.target.value);
                      }}
                      onFocus={() => addressQuery.length >= 3 && setShowSuggestions(true)}
                      placeholder="Start typing your address..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm pr-10" 
                  />
                  {searchingLocation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                
                {/* Location Suggestions Dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {locationSuggestions.map((location, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectLocation(location)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-colors border-b border-slate-100 last:border-0 flex items-start gap-2"
                      >
                        <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">location_on</span>
                        <span className="flex-1">{location.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Major (Optional)</label>
                <input 
                    type="text" 
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Current Year (Optional)</label>
                <select 
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                >
                    <option value="">Select Year</option>
                    <option value="L1">Licence 1 (L1)</option>
                    <option value="L2">Licence 2 (L2)</option>
                    <option value="L3">Licence 3 (L3)</option>
                    <option value="M1">Master 1 (M1)</option>
                    <option value="M2">Master 2 (M2)</option>
                </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  Skip for Now
              </button>
              <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {loading ? 'Saving...' : 'Complete'}
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="p-6 border-t border-slate-100 text-center bg-slate-50">
              <p className="text-sm text-slate-500">
                  Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
              </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Signup;
