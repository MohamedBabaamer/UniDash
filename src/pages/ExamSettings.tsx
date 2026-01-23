import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

interface ExamSettingsData {
  globalExamDate: string;
  isEnabled: boolean;
  academicYear: string;
}

const ExamSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [settings, setSettings] = useState<ExamSettingsData>({
    globalExamDate: new Date().toISOString().split('T')[0],
    isEnabled: true,
    academicYear: '2025-2026'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'examSettings');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data() as ExamSettingsData);
      } else {
        console.log('No existing settings found, using defaults');
        // Document doesn't exist yet, keep default values
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      // Don't show error for first time - just use defaults
      console.log('Using default settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'examSettings');
      console.log('Attempting to save settings:', settings);
      await setDoc(docRef, settings);
      
      setNotification({ type: 'success', message: 'Exam settings saved successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to save settings';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Make sure you are logged in as an admin.';
      } else if (error.message) {
        errorMessage = `Failed to save: ${error.message}`;
      }
      
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const isExamDatePassed = new Date() >= new Date(settings.globalExamDate);
  const daysUntilExam = Math.ceil((new Date(settings.globalExamDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 z-50 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
              <span className="material-symbols-outlined text-7xl text-primary animate-bounce">
                settings
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
              Loading Settings
            </h2>
            <p className="text-slate-500 font-medium">
              Preparing exam configuration...
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

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-purple-600">schedule</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Exam Settings</h1>
            <p className="text-slate-500 text-sm">Control global solution unlock date</p>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">
              {notification.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {notification.message}
          </div>
        </div>
      )}

      {/* Status Card */}
      <div className={`mb-6 p-6 rounded-xl border-2 ${
        isExamDatePassed 
          ? 'bg-green-50 border-green-300' 
          : 'bg-amber-50 border-amber-300'
      }`}>
        <div className="flex items-start gap-4">
          <span className={`material-symbols-outlined text-4xl ${
            isExamDatePassed ? 'text-green-600' : 'text-amber-600'
          }`}>
            {isExamDatePassed ? 'lock_open' : 'lock'}
          </span>
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-2 ${
              isExamDatePassed ? 'text-green-900' : 'text-amber-900'
            }`}>
              {isExamDatePassed ? 'Solutions Unlocked' : 'Solutions Locked'}
            </h3>
            <p className={`text-sm ${
              isExamDatePassed ? 'text-green-700' : 'text-amber-700'
            }`}>
              {isExamDatePassed 
                ? 'All TD/TP solutions are currently accessible to students.'
                : `Solutions will unlock in ${daysUntilExam} day${daysUntilExam !== 1 ? 's' : ''} on ${new Date(settings.globalExamDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined">settings</span>
            Global Exam Configuration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Set a single exam date that controls solution access for all courses
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Enable Solution Lock
              </label>
              <p className="text-xs text-slate-500">
                Lock all TD/TP solutions until exam date
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Academic Year
            </label>
            <input
              type="text"
              value={settings.academicYear}
              onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="e.g., 2025-2026"
            />
          </div>

          {/* Global Exam Date */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <span className="material-symbols-outlined text-lg align-middle mr-1">event</span>
              Global Exam Date *
            </label>
            <input
              type="date"
              value={settings.globalExamDate}
              onChange={(e) => setSettings({ ...settings, globalExamDate: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              All TD/TP solutions will automatically unlock on this date
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600">info</span>
              <div className="text-sm text-blue-800">
                <p className="font-bold mb-1">How it works:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Before exam date: All solutions are locked for all courses</li>
                  <li>On exam date: Solutions automatically unlock for all courses</li>
                  <li>Students see countdown and unlock status on course pages</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={fetchSettings}
            className="px-6 py-3 text-slate-600 hover:text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSettings;
