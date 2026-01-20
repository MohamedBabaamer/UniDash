import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, clearAllUserData } from '../services/database.service';
import type { UserProfile } from '../types';

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

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
      <div className="p-6 md:p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayProfile = isEditing ? formData : profile || {};

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        {/* Header / Cover */}
         <div className="relative mb-12">
            <div className={`h-48 rounded-2xl w-full object-cover ${
              displayProfile.role === 'admin' 
                ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900' 
                : 'bg-gradient-to-r from-primary to-blue-400'
            }`}></div>
            <div className="absolute -bottom-10 left-6 md:left-8 flex items-end gap-4">
                 <div className="relative">
                   <div 
                     className={`size-24 rounded-2xl border-4 border-white shadow-md bg-cover bg-center flex items-center justify-center text-white text-3xl font-bold ${
                       displayProfile.role === 'admin' ? 'bg-slate-800' : 'bg-primary'
                     }`}
                     style={{ backgroundImage: displayProfile.photoURL ? `url(${displayProfile.photoURL})` : undefined }}
                   >
                     {!displayProfile.photoURL && (displayProfile.displayName?.[0] || displayProfile.email?.[0] || 'U').toUpperCase()}
                   </div>
                   {/* Role Badge */}
                   {displayProfile.role === 'admin' && (
                     <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white rounded-full p-1.5 shadow-lg border-2 border-white">
                       <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                     </div>
                   )}
                   {displayProfile.role === 'student' && (
                     <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg border-2 border-white">
                       <span className="material-symbols-outlined text-[16px]">school</span>
                     </div>
                   )}
                 </div>
                 <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-slate-900">{displayProfile.displayName || user?.displayName || 'User'}</h1>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        displayProfile.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {displayProfile.role === 'admin' ? 'admin_panel_settings' : 'person'}
                        </span>
                        {displayProfile.role === 'admin' ? 'Admin' : 'Student'}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium">Student ID: {displayProfile.studentId || 'Not set'}</p>
                 </div>
            </div>
            <div className="absolute -bottom-10 right-6 md:right-8 mb-2 flex gap-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleClearData}
                      className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 font-bold rounded-lg shadow-sm hover:bg-red-100 transition-colors text-sm"
                      title="Clear all your data"
                    >
                      Clear Data
                    </button>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm"
                    >
                      Edit Profile
                    </button>
                  </>
                )}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
            {/* Left Column - Contact */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">contact_page</span>
                        Contact Info
                    </h3>
                    <div className="space-y-4">
                         <div className="flex items-start gap-3">
                             <span className="material-symbols-outlined text-slate-400">account_circle</span>
                             <div className="overflow-hidden flex-1">
                                 <p className="text-xs font-bold text-slate-500 uppercase">Profile Picture URL</p>
                                 {isEditing ? (
                                   <input 
                                     type="url" 
                                     value={formData.photoURL || ''} 
                                     onChange={(e) => handleChange('photoURL', e.target.value)}
                                     className="text-sm font-medium text-slate-900 w-full border border-slate-200 rounded px-2 py-1 mt-1"
                                     placeholder="https://example.com/photo.jpg"
                                   />
                                 ) : (
                                   <p className="text-sm font-medium text-slate-900 truncate">{displayProfile.photoURL || 'No photo URL'}</p>
                                 )}
                             </div>
                         </div>
                         <div className="flex items-start gap-3">
                             <span className="material-symbols-outlined text-slate-400">mail</span>
                             <div className="overflow-hidden flex-1">
                                 <p className="text-xs font-bold text-slate-500 uppercase">Email</p>
                                 {isEditing ? (
                                   <input 
                                     type="email" 
                                     value={formData.email || ''} 
                                     onChange={(e) => handleChange('email', e.target.value)}
                                     className="text-sm font-medium text-slate-900 w-full border border-slate-200 rounded px-2 py-1 mt-1"
                                     disabled
                                   />
                                 ) : (
                                   <p className="text-sm font-medium text-slate-900 truncate" title={displayProfile.email}>{displayProfile.email || user?.email || 'Not set'}</p>
                                 )}
                             </div>
                         </div>
                         <div className="flex items-start gap-3">
                             <span className="material-symbols-outlined text-slate-400">call</span>
                             <div className="flex-1">
                                 <p className="text-xs font-bold text-slate-500 uppercase">Phone</p>
                                 {isEditing ? (
                                   <input 
                                     type="tel" 
                                     value={formData.phone || ''} 
                                     onChange={(e) => handleChange('phone', e.target.value)}
                                     className="text-sm font-medium text-slate-900 w-full border border-slate-200 rounded px-2 py-1 mt-1"
                                     placeholder="Enter phone"
                                   />
                                 ) : (
                                   <p className="text-sm font-medium text-slate-900">{displayProfile.phone || 'Not set'}</p>
                                 )}
                             </div>
                         </div>
                         <div className="flex items-start gap-3">
                             <span className="material-symbols-outlined text-slate-400">location_on</span>
                             <div className="flex-1 relative">
                                 <p className="text-xs font-bold text-slate-500 uppercase">Address</p>
                                 {isEditing ? (
                                   <>
                                     <div className="relative">
                                       <input 
                                         type="text" 
                                         value={addressQuery} 
                                         onChange={(e) => handleChange('address', e.target.value)}
                                         onFocus={() => addressQuery.length >= 3 && setShowSuggestions(true)}
                                         className="text-sm font-medium text-slate-900 w-full border border-slate-200 rounded px-2 py-1 mt-1 pr-8"
                                         placeholder="Start typing address..."
                                       />
                                       {searchingLocation && (
                                         <div className="absolute right-2 top-1/2 -translate-y-1/2 mt-0.5">
                                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                         </div>
                                       )}
                                     </div>
                                     
                                     {/* Location Suggestions Dropdown */}
                                     {showSuggestions && locationSuggestions.length > 0 && (
                                       <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                         {locationSuggestions.map((location, index) => (
                                           <button
                                             key={index}
                                             type="button"
                                             onClick={() => selectLocation(location)}
                                             className="w-full px-3 py-2 text-left text-sm hover:bg-primary/5 transition-colors border-b border-slate-100 last:border-0 flex items-start gap-2"
                                           >
                                             <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">location_on</span>
                                             <span className="flex-1">{location.display_name}</span>
                                           </button>
                                         ))}
                                       </div>
                                     )}
                                   </>
                                 ) : (
                                   <p className="text-sm font-medium text-slate-900">{displayProfile.address || 'Not set'}</p>
                                 )}
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Academic */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">school</span>
                        Academic Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-500 uppercase">Major</p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.major || ''} 
                                onChange={(e) => handleChange('major', e.target.value)}
                                className="text-base font-bold text-slate-900 w-full border border-slate-200 rounded px-2 py-1"
                                placeholder="Enter major"
                              />
                            ) : (
                              <p className="text-base font-bold text-slate-900">{displayProfile.major || 'Not set'}</p>
                            )}
                        </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-500 uppercase">Minor</p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.minor || ''} 
                                onChange={(e) => handleChange('minor', e.target.value)}
                                className="text-base font-bold text-slate-900 w-full border border-slate-200 rounded px-2 py-1"
                                placeholder="Enter minor"
                              />
                            ) : (
                              <p className="text-base font-bold text-slate-900">{displayProfile.minor || 'Not set'}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-500 uppercase">Current Year</p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.year || ''} 
                                onChange={(e) => handleChange('year', e.target.value)}
                                className="text-base font-bold text-slate-900 w-full border border-slate-200 rounded px-2 py-1"
                                placeholder="e.g., Year 2 (L2)"
                              />
                            ) : (
                              <p className="text-base font-bold text-slate-900">{displayProfile.year || 'Not set'}</p>
                            )}
                        </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-500 uppercase">Enrollment Year</p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.enrollmentYear || ''} 
                                onChange={(e) => handleChange('enrollmentYear', e.target.value)}
                                className="text-base font-bold text-slate-900 w-full border border-slate-200 rounded px-2 py-1"
                                placeholder="e.g., 2022"
                              />
                            ) : (
                              <p className="text-base font-bold text-slate-900">{displayProfile.enrollmentYear || 'Not set'}</p>
                            )}
                        </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-500 uppercase">Academic Advisor</p>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={formData.advisor || ''} 
                                onChange={(e) => handleChange('advisor', e.target.value)}
                                className="text-base font-bold text-slate-900 w-full border border-slate-200 rounded px-2 py-1"
                                placeholder="Enter advisor name"
                              />
                            ) : (
                              <p className="text-base font-bold text-slate-900">{displayProfile.advisor || 'Not set'}</p>
                            )}
                        </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-500 uppercase">Status</p>
                            {isEditing ? (
                              <select 
                                value={formData.status || 'Active'} 
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="text-base font-bold text-slate-900 w-full border border-slate-200 rounded px-2 py-1"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Graduated">Graduated</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                displayProfile.status === 'Active' ? 'bg-green-100 text-green-800' :
                                displayProfile.status === 'Graduated' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {displayProfile.status || 'Active'}
                              </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Academic Performance</h3>
                     <div className="flex items-center gap-8">
                         <div className="flex-1">
                             <p className="text-xs font-bold text-slate-500 uppercase">Cumulative GPA</p>
                             {isEditing ? (
                               <input 
                                 type="text" 
                                 value={formData.gpa || ''} 
                                 onChange={(e) => handleChange('gpa', e.target.value)}
                                 className="text-3xl font-black text-primary w-full border border-slate-200 rounded px-2 py-1 mt-1"
                                 placeholder="e.g., 3.8"
                               />
                             ) : (
                               <p className="text-3xl font-black text-primary">{displayProfile.gpa || 'N/A'}</p>
                             )}
                         </div>
                          <div className="h-10 w-px bg-slate-200"></div>
                         <div className="flex-1">
                             <p className="text-xs font-bold text-slate-500 uppercase">Credits Earned</p>
                             {isEditing ? (
                               <input 
                                 type="number" 
                                 value={formData.creditsEarned || 0} 
                                 onChange={(e) => handleChange('creditsEarned', e.target.value)}
                                 className="text-3xl font-black text-slate-900 w-full border border-slate-200 rounded px-2 py-1 mt-1"
                                 placeholder="0"
                               />
                             ) : (
                               <p className="text-3xl font-black text-slate-900">{displayProfile.creditsEarned || 0} <span className="text-sm font-normal text-slate-400">/ 180</span></p>
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