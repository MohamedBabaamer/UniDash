import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserProfile, deleteUserProfile } from '../services/database.service';
import type { UserProfile } from '../types';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData(user);
  };

  const handleSave = async () => {
    if (!editingUser?.id) return;
    
    setSaving(true);
    try {
      await updateUserProfile(editingUser.id, formData);
      await fetchUsers();
      setEditingUser(null);
      setFormData({});
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user ${email}? This action cannot be undone!`
    );
    
    if (confirmed) {
      try {
        await deleteUserProfile(userId);
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 z-50 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
              <span className="material-symbols-outlined text-7xl text-primary animate-bounce">
                group
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
              Loading Users
            </h2>
            <p className="text-slate-500 font-medium">
              Fetching user data...
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl">group</span>
            Manage Users
          </h1>
          <p className="text-slate-500 mt-1">View and manage all registered users</p>
        </div>
        <div className="px-4 py-2 bg-slate-100 rounded-lg">
          <span className="text-sm font-bold text-slate-600">Total Users: {users.length}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{user.displayName || 'No name'}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.studentId || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {user.role === 'admin' ? 'admin_panel_settings' : 'person'}
                        </span>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => user.id && handleDelete(user.id, user.email)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="xl:hidden divide-y divide-slate-200">
          {users.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No users found
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {(user.displayName || user.email)?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{user.displayName || 'No name'}</h3>
                    <p className="text-xs text-slate-600 truncate">{user.email}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <span className="material-symbols-outlined text-[12px]">
                        {user.role === 'admin' ? 'admin_panel_settings' : 'person'}
                      </span>
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Student ID</p>
                    <p className="text-xs font-semibold text-slate-900">{user.studentId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Phone</p>
                    <p className="text-xs font-semibold text-slate-900">{user.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleEdit(user)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => user.id && handleDelete(user.id, user.email)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                Edit User
              </h2>
              <p className="text-slate-500 text-sm mt-1">Update user information and role</p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName || ''}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter display name"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* Student ID */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={formData.studentId || ''}
                    onChange={(e) => handleChange('studentId', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter student ID"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={2}
                    placeholder="Enter address"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role || 'student'}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="student">🎓 Student (View Only)</option>
                    <option value="admin">👑 Admin (Full Access)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Admin users can create, edit, and delete courses and chapters
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingUser(null);
                  setFormData({});
                }}
                disabled={saving}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
