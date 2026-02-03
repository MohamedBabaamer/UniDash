import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getUserProfile, updateUserProfile, clearAllUserData } from '../services/database.service';
import type { UserProfile } from '../types/types';

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

// Helper function to mask email
const maskEmail = (email: string): string => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  if (username.length <= 2) return email;
  return `${username.substring(0, 2)}${'*'.repeat(Math.min(username.length - 2, 4))}@${domain}`;
};

// Helper function to shorten URL
const shortenUrl = (url: string): string => {
  if (!url) return '';
  if (url.length <= 30) return url;
  return `${url.substring(0, 20)}...${url.substring(url.length - 7)}`;
};

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  
  // Location autocomplete state
  const [addressQuery, setAddressQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
          setFormData(userProfile || {});
          setAddressQuery(userProfile?.address || '');
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  // Location autocomplete with debounce
  useEffect(() => {
    if (!isEditing || addressQuery.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        // Using Nominatim (OpenStreetMap) free geocoding API
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
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [addressQuery, isEditing]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // If profile doesn't exist yet, ensure we include required fields
      if (!profile) {
        await updateUserProfile(user.uid, {
          ...formData,
          email: user.email || '',
          displayName: formData.displayName || user.displayName || '',
          role: 'student', // Default role for new profiles
        });
      } else {
        await updateUserProfile(user.uid, formData);
      }
      const updatedProfile = await getUserProfile(user.uid);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to clear ALL your data? This will delete your profile, courses, and payments. This action cannot be undone!'
    );
    
    if (confirmed) {
      try {
        await clearAllUserData(user.uid);
        alert('All data cleared successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
      }
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'address') {
      setAddressQuery(value);
    }
  };

  const selectLocation = (location: LocationSuggestion) => {
    setAddressQuery(location.display_name);
    setFormData(prev => ({ ...prev, address: location.display_name }));
    setShowSuggestions(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 z-50 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
              <span className="material-symbols-outlined text-7xl text-primary animate-bounce">
                account_circle
              </span>
            </div>
          </div>

          <div className="flex justify-center items-center gap-3">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{ animationDuration: '0.6s' }}></div>
              <div className="absolute inset-2 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-2 border-4 border-primary/50 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.5s' }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Loading Profile
            </h2>
            <p className="text-slate-500 font-medium">
              Preparing your information...
            </p>
            
            <div className="flex justify-center gap-2 pt-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          <div className="w-64 mx-auto">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full" style={{ width: '100%', animation: 'shimmer 0.8s ease-in-out infinite' }}></div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  const displayProfile = isEditing ? formData : profile || {};

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Enhanced Header / Cover with Pattern */}
         <div className="relative mb-16 sm:mb-20 overflow-hidden">
            <div className={`h-48 sm:h-56 md:h-60 rounded-2xl md:rounded-3xl w-full relative overflow-hidden shadow-xl ${
              displayProfile.role === 'admin' 
                ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900' 
                : 'bg-gradient-to-br from-primary via-blue-500 to-blue-600'
            }`}>
              {/* Decorative Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-48 translate-y-48"></div>
              </div>
              
              {/* Profile Info Section - Now INSIDE the gradient */}
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 md:left-8 right-4 sm:right-32 md:right-40 flex items-end gap-3 sm:gap-5">
                   <div className="relative group flex-shrink-0">
                     <div 
                       className={`size-20 sm:size-24 md:size-28 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-white shadow-xl bg-cover bg-center flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-black transition-transform group-hover:scale-105 ${
                         displayProfile.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-primary to-blue-600'
                       }`}
                       style={{ backgroundImage: displayProfile.photoURL ? `url(${displayProfile.photoURL})` : undefined }}
                     >
                       {!displayProfile.photoURL && (displayProfile.displayName?.[0] || displayProfile.email?.[0] || 'U').toUpperCase()}
                     </div>
                     {/* Role Badge with Animation */}
                     {displayProfile.role === 'admin' && (
                       <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-lg border-2 border-white animate-pulse">
                         <span className="material-symbols-outlined text-[14px] sm:text-[18px]">admin_panel_settings</span>
                       </div>
                     )}
                     {displayProfile.role === 'student' && (
                       <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-lg border-2 border-white">
                         <span className="material-symbols-outlined text-[14px] sm:text-[18px]">school</span>
                       </div>
                     )}
                   </div>
                   <div className="mb-2 sm:mb-3 space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg break-words max-w-full">{displayProfile.displayName || user?.displayName || 'User'}</h1>
                        <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg backdrop-blur-sm flex-shrink-0 ${
                          displayProfile.role === 'admin' 
                            ? 'bg-white/90 text-purple-700 border-2 border-white' 
                            : 'bg-white/90 text-blue-700 border-2 border-white'
                        }`}>
                          <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
                            {displayProfile.role === 'admin' ? 'admin_panel_settings' : 'person'}
                          </span>
                          <span className="hidden xs:inline">{displayProfile.role === 'admin' ? 'Admin' : 'Student'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-white/90 flex-wrap text-xs sm:text-sm">
                        <span className="flex items-center gap-1 sm:gap-1.5 font-semibold drop-shadow">
                          <span className="material-symbols-outlined text-[16px] sm:text-[18px]">badge</span>
                          <span className="truncate">ID: {displayProfile.studentId || 'Not set'}</span>
                        </span>
                        <span className="text-white/40 hidden sm:inline">•</span>
                        <span className="flex items-center gap-1 sm:gap-1.5 font-semibold drop-shadow truncate max-w-[200px] sm:max-w-xs">
                          <span className="material-symbols-outlined text-[16px] sm:text-[18px]">mail</span>
                          <span className="truncate">{maskEmail(displayProfile.email || user?.email || 'Not set')}</span>
                        </span>
                      </div>
                      {/* Stats Bar */}
                      <div className="flex gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-white/80 flex-wrap">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold drop-shadow">
                          <span className="material-symbols-outlined text-[14px] sm:text-[16px]">calendar_today</span>
                          <span>Joined {displayProfile.enrollmentYear || '2024'}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold drop-shadow">
                          <span className="material-symbols-outlined text-[14px] sm:text-[16px]">bookmark</span>
                          <span>{displayProfile.year || 'Year N/A'}</span>
                        </div>
                      </div>
                   </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-8 flex gap-1.5 sm:gap-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-white/95 backdrop-blur-sm border-2 border-white text-slate-700 font-bold rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-lg hover:bg-white hover:scale-105 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">close</span>
                      <span className="hidden md:inline">Cancel</span>
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-white text-primary font-bold rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-primary"></div>
                          <span className="hidden md:inline">Saving...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">check</span>
                          <span className="hidden md:inline">Save</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-white/95 backdrop-blur-sm border-2 border-slate-200 text-slate-700 font-bold rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-lg hover:bg-white hover:scale-105 transition-all">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">home</span>
                      <span className="hidden md:inline">Home</span>
                    </Link>
                    <button 
                      onClick={handleClearData}
                      className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 bg-white/95 backdrop-blur-sm border-2 border-red-200 text-red-700 font-bold rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-lg hover:bg-white hover:border-red-300 hover:scale-105 transition-all"
                      title="Clear all your data"
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">delete_sweep</span>
                      <span className="hidden lg:inline">Clear</span>
                    </button>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-white text-primary font-bold rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">edit</span>
                      <span className="hidden md:inline">Edit</span>
                    </button>
                  </>
                )}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 pt-2">
            {/* Left Column - Contact & Quick Stats */}
            <div className="space-y-4 sm:space-y-6">
                {/* Contact Info Card */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl border-2 border-slate-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 mb-3 sm:mb-4 md:mb-5 flex items-center gap-1.5 sm:gap-2">
                        <div className="p-1 sm:p-1.5 md:p-2 bg-primary/10 rounded-md sm:rounded-lg md:rounded-xl">
                          <span className="material-symbols-outlined text-primary text-lg sm:text-xl md:text-2xl">contact_page</span>
                        </div>
                        <span>Contact Info</span>
                    </h3>
                    <div className="space-y-3 sm:space-y-4 md:space-y-5">
                         <div className="flex items-start gap-2 sm:gap-3 group">
                             <div className="p-1 sm:p-1.5 md:p-2 bg-slate-100 rounded-md sm:rounded-lg group-hover:bg-primary/10 transition-colors flex-shrink-0">
                               <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors text-[18px] sm:text-[20px] md:text-[24px]">account_circle</span>
                             </div>
                             <div className="overflow-hidden flex-1 min-w-0">
                                 <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Profile Picture URL</p>
                                 {isEditing ? (
                                   <input 
                                     type="url" 
                                     value={formData.photoURL || ''} 
                                     onChange={(e) => handleChange('photoURL', e.target.value)}
                                     className="text-xs sm:text-sm font-semibold text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                     placeholder="https://example.com/photo.jpg"
                                   />
                                 ) : (
                                   <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate" title={displayProfile.photoURL}>{shortenUrl(displayProfile.photoURL) || 'No photo URL'}</p>
                                 )}
                             </div>
                         </div>
                         <div className="flex items-start gap-2 sm:gap-3 group">
                             <div className="p-1 sm:p-1.5 md:p-2 bg-slate-100 rounded-md sm:rounded-lg group-hover:bg-primary/10 transition-colors flex-shrink-0">
                               <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors text-[18px] sm:text-[20px] md:text-[24px]">mail</span>
                             </div>
                             <div className="overflow-hidden flex-1 min-w-0">
                                 <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Email</p>
                                 <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate" title={displayProfile.email || user?.email}>{maskEmail(displayProfile.email || user?.email || 'Not set')}</p>
                             </div>
                         </div>
                         <div className="flex items-start gap-2 sm:gap-3 group">
                             <div className="p-1 sm:p-1.5 md:p-2 bg-slate-100 rounded-md sm:rounded-lg group-hover:bg-primary/10 transition-colors flex-shrink-0">
                               <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors text-[18px] sm:text-[20px] md:text-[24px]">call</span>
                             </div>
                             <div className="flex-1 min-w-0">
                                 <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Phone</p>
                                 {isEditing ? (
                                   <input 
                                     type="tel" 
                                     value={formData.phone || ''} 
                                     onChange={(e) => handleChange('phone', e.target.value)}
                                     className="text-xs sm:text-sm font-semibold text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                     placeholder="Enter phone"
                                   />
                                 ) : (
                                   <p className="text-xs sm:text-sm font-semibold text-slate-900">{displayProfile.phone || 'Not set'}</p>
                                 )}
                             </div>
                         </div>
                         <div className="flex items-start gap-2 sm:gap-3 group">
                             <div className="p-1 sm:p-1.5 md:p-2 bg-slate-100 rounded-md sm:rounded-lg group-hover:bg-primary/10 transition-colors flex-shrink-0">
                               <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors text-[18px] sm:text-[20px] md:text-[24px]">location_on</span>
                             </div>
                             <div className="flex-1 relative min-w-0">
                                 <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Address</p>
                                 {isEditing ? (
                                   <>
                                     <div className="relative">
                                       <input 
                                         type="text" 
                                         value={addressQuery} 
                                         onChange={(e) => handleChange('address', e.target.value)}
                                         onFocus={() => addressQuery.length >= 3 && setShowSuggestions(true)}
                                         className="text-xs sm:text-sm font-semibold text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 pr-8 sm:pr-10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                         placeholder="Start typing address..."
                                       />
                                       {searchingLocation && (
                                         <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
                                           <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-primary border-t-transparent"></div>
                                         </div>
                                       )}
                                     </div>
                                     
                                     {/* Location Suggestions Dropdown */}
                                     {showSuggestions && locationSuggestions.length > 0 && (
                                       <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                         {locationSuggestions.map((location, index) => (
                                           <button
                                             key={index}
                                             type="button"
                                             onClick={() => selectLocation(location)}
                                             className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hover:bg-primary/5 transition-colors border-b border-slate-100 last:border-0 flex items-start gap-2 sm:gap-3 group/item"
                                           >
                                             <span className="material-symbols-outlined text-primary text-[16px] sm:text-[18px] mt-0.5 group-hover/item:scale-110 transition-transform flex-shrink-0">location_on</span>
                                             <span className="flex-1 font-medium text-slate-700 group-hover/item:text-slate-900 break-words">{location.display_name}</span>
                                           </button>
                                         ))}
                                       </div>
                                     )}
                                   </>
                                 ) : (
                                   <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words">{displayProfile.address || 'Not set'}</p>
                                 )}
                             </div>
                         </div>
                    </div>
                </div>
                
                {/* Quick Stats Card */}
                <div className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-xl sm:rounded-2xl border-2 border-primary/20 p-4 sm:p-6 shadow-lg">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">trending_up</span>
                    <span>Quick Stats</span>
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center p-2.5 sm:p-3 bg-white/70 rounded-lg sm:rounded-xl">
                      <span className="text-xs sm:text-sm font-bold text-slate-600">Status</span>
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold ${
                        displayProfile.status === 'Active' ? 'bg-green-100 text-green-700' :
                        displayProfile.status === 'Graduated' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {displayProfile.status || 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 sm:p-3 bg-white/70 rounded-lg sm:rounded-xl">
                      <span className="text-xs sm:text-sm font-bold text-slate-600">Credits</span>
                      <span className="text-xs sm:text-sm font-black text-primary">{displayProfile.creditsEarned || 0} / 180</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 sm:p-3 bg-white/70 rounded-lg sm:rounded-xl">
                      <span className="text-xs sm:text-sm font-bold text-slate-600">GPA</span>
                      <span className="text-xs sm:text-sm font-black text-primary">{displayProfile.gpa || 'N/A'}</span>
                    </div>
                  </div>
                </div>
            </div>

            {/* Right Column - Academic Details */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Academic Details Card */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl border-2 border-slate-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
                     <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-4 sm:mb-5 flex items-center gap-2">
                        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl">
                          <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">school</span>
                        </div>
                        <span>Academic Details</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                        <div className="space-y-2 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg sm:rounded-xl border border-slate-200">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">book</span>
                              <span>Major</span>
                            </p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.major || ''} 
                                onChange={(e) => handleChange('major', e.target.value)}
                                className="text-sm sm:text-base font-bold text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="Enter major"
                              />
                            ) : (
                              <p className="text-sm sm:text-base font-bold text-slate-900">{displayProfile.major || 'Not set'}</p>
                            )}
                        </div>
                         <div className="space-y-2 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg sm:rounded-xl border border-slate-200">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">bookmark</span>
                              <span>Minor</span>
                            </p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.minor || ''} 
                                onChange={(e) => handleChange('minor', e.target.value)}
                                className="text-sm sm:text-base font-bold text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="Enter minor"
                              />
                            ) : (
                              <p className="text-sm sm:text-base font-bold text-slate-900">{displayProfile.minor || 'Not set'}</p>
                            )}
                        </div>
                        <div className="space-y-2 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg sm:rounded-xl border border-slate-200">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">calendar_today</span>
                              <span>Current Year</span>
                            </p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.year || ''} 
                                onChange={(e) => handleChange('year', e.target.value)}
                                className="text-sm sm:text-base font-bold text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="e.g., Year 2 (L2)"
                              />
                            ) : (
                              <p className="text-sm sm:text-base font-bold text-slate-900">{displayProfile.year || 'Not set'}</p>
                            )}
                        </div>
                         <div className="space-y-2 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg sm:rounded-xl border border-slate-200">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">event</span>
                              <span>Enrollment Year</span>
                            </p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.enrollmentYear || ''} 
                                onChange={(e) => handleChange('enrollmentYear', e.target.value)}
                                className="text-sm sm:text-base font-bold text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="e.g., 2022"
                              />
                            ) : (
                              <p className="text-sm sm:text-base font-bold text-slate-900">{displayProfile.enrollmentYear || 'Not set'}</p>
                            )}
                        </div>
                         <div className="space-y-2 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg sm:rounded-xl border border-slate-200">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">person</span>
                              <span>Academic Advisor</span>
                            </p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.advisor || ''} 
                                onChange={(e) => handleChange('advisor', e.target.value)}
                                className="text-sm sm:text-base font-bold text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="Enter advisor name"
                              />
                            ) : (
                              <p className="text-sm sm:text-base font-bold text-slate-900">{displayProfile.advisor || 'Not set'}</p>
                            )}
                        </div>
                         <div className="space-y-2 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg sm:rounded-xl border border-slate-200">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">verified</span>
                              <span>Status</span>
                            </p>
                            {isEditing ? (
                              <select 
                                value={formData.status || 'Active'} 
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="text-sm sm:text-base font-bold text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Graduated">Graduated</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold ${
                                displayProfile.status === 'Active' ? 'bg-green-100 text-green-800' :
                                displayProfile.status === 'Graduated' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
                                  {displayProfile.status === 'Active' ? 'check_circle' : displayProfile.status === 'Graduated' ? 'workspace_premium' : 'pause_circle'}
                                </span>
                                <span>{displayProfile.status || 'Active'}</span>
                              </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Academic Performance Card */}
                <div className="bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50 rounded-xl sm:rounded-2xl border-2 border-primary/20 p-4 sm:p-6 md:p-8 shadow-lg">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">auto_graph</span>
                      <span>Academic Performance</span>
                    </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                         <div className="bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-white shadow-sm">
                             <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 sm:gap-2">
                               <span className="material-symbols-outlined text-[16px] sm:text-[18px]">grade</span>
                               <span>Cumulative GPA</span>
                             </p>
                             {isEditing ? (
                               <input 
                                 type="text" 
                                 value={formData.gpa || ''} 
                                 onChange={(e) => handleChange('gpa', e.target.value)}
                                 className="text-3xl sm:text-4xl font-black text-primary w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                 placeholder="e.g., 3.8"
                               />
                             ) : (
                               <div className="flex items-baseline gap-1.5 sm:gap-2">
                                 <p className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{displayProfile.gpa || 'N/A'}</p>
                                 <span className="text-sm sm:text-base md:text-lg text-slate-400 font-semibold">/ 4.0</span>
                               </div>
                             )}
                         </div>
                         <div className="bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-white shadow-sm">
                             <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 sm:gap-2">
                               <span className="material-symbols-outlined text-[16px] sm:text-[18px]">workspace_premium</span>
                               <span>Credits Earned</span>
                             </p>
                             {isEditing ? (
                               <input 
                                 type="number" 
                                 value={formData.creditsEarned || 0} 
                                 onChange={(e) => handleChange('creditsEarned', e.target.value)}
                                 className="text-3xl sm:text-4xl font-black text-slate-900 w-full border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                 placeholder="0"
                               />
                             ) : (
                               <div className="space-y-1.5 sm:space-y-2">
                                 <div className="flex items-baseline gap-1.5 sm:gap-2">
                                   <p className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900">{displayProfile.creditsEarned || 0}</p>
                                   <span className="text-sm sm:text-base md:text-lg text-slate-400 font-semibold">/ 180</span>
                                 </div>
                                 {/* Progress Bar */}
                                 <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                   <div 
                                     className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full transition-all duration-500"
                                     style={{ width: `${Math.min((Number(displayProfile.creditsEarned || 0) / 180) * 100, 100)}%` }}
                                   ></div>
                                 </div>
                               </div>
                             )}
                         </div>
                     </div>
                </div>
            </div>
         </div>
    </div>
  );
};

export default Profile;