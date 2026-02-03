import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { Link } from 'react-router-dom';
import { 
  getAllCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  clearAllCourses 
} from '../services/database.service';

const AdminModules: React.FC = () => {
  const [modules, setModules] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Course | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter States
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const coursesData = await getAllCourses();
      setModules(coursesData);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this module? This action cannot be undone!')) {
      try {
        await deleteCourse(id);
        setModules(modules.filter(m => m.id !== id));
      } catch (error) {
        console.error('Error deleting module:', error);
        alert('Error deleting module. Please try again.');
      }
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL courses? This action cannot be undone and will affect all users!'
    );
    
    if (confirmed) {
      try {
        await clearAllCourses();
        setModules([]);
        alert('All courses cleared successfully!');
      } catch (error) {
        console.error('Error clearing courses:', error);
        alert('Error clearing courses. Please try again.');
      }
    }
  };

  const handleEdit = (module: Course) => {
    setEditingModule(module);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingModule(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const moduleData: Omit<Course, 'id'> = {
        code: formData.get('code') as string,
        name: formData.get('name') as string,
        professor: formData.get('professor') as string,
        credits: Number(formData.get('credits')),
        type: formData.get('type') as 'Core' | 'Elective',
        level: formData.get('level') as any,
        semester: Number(formData.get('semester')) as 1 | 2,
        academicYear: formData.get('academicYear') as string,
        status: formData.get('status') as any,
        progress: editingModule ? editingModule.progress : 0,
        color: formData.get('color') as string || 'text-blue-600',
        icon: formData.get('icon') as string || 'book',
        // Resource availability flags
        hasCours: formData.get('hasCours') === 'on',
        hasTD: formData.get('hasTD') === 'on',
        hasTP: formData.get('hasTP') === 'on',
        hasExam: formData.get('hasExam') === 'on'
      };

      if (editingModule) {
        await updateCourse(editingModule.id, moduleData);
        setModules(modules.map(m => m.id === editingModule.id ? { ...m, ...moduleData } : m));
        setNotification({ type: 'success', message: 'Module updated successfully!' });
      } else {
        const newId = await createCourse(moduleData);
        setModules([...modules, { ...moduleData, id: newId }]);
        setNotification({ type: 'success', message: 'Module created successfully!' });
      }
      
      setIsModalOpen(false);
      setEditingModule(null);
      
      // Auto-dismiss notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error saving module:', error);
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Error saving module. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Filter Logic
  const filteredModules = modules.filter(module => {
    const matchLevel = filterLevel === 'All' || module.level === filterLevel;
    const matchType = filterType === 'All' || module.type === filterType;
    const matchStatus = filterStatus === 'All' || module.status === filterStatus;
    return matchLevel && matchType && matchStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Completed': return 'bg-blue-100 text-blue-700';
      case 'Upcoming': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 z-50 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          {/* Animated Logo/Icon */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
              <span className="material-symbols-outlined text-7xl text-primary animate-bounce">
                school
              </span>
            </div>
          </div>

          {/* Loading Rings */}
          <div className="flex justify-center items-center gap-3">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{ animationDuration: '0.6s' }}></div>
              <div className="absolute inset-2 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-2 border-4 border-primary/50 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.5s' }}></div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Loading Modules
            </h2>
            <p className="text-slate-500 font-medium">
              Preparing your content...
            </p>
            
            {/* Animated Dots */}
            <div className="flex justify-center gap-2 pt-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-64 mx-auto">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-[shimmer_0.8s_ease-in-out_infinite]"
                   style={{ width: '100%', animation: 'shimmer 0.8s ease-in-out infinite' }}>
              </div>
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Module Management</h2>
            <p className="text-slate-500 mt-1">Create, update, and manage academic modules and courses.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleClearAll}
                className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg font-bold shadow-sm hover:bg-red-100 transition-all"
            >
                <span className="material-symbols-outlined">delete_sweep</span>
                Clear All
            </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        
        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4 bg-slate-50/50">
           <div className="flex items-center gap-2 mr-2">
              <span className="material-symbols-outlined text-slate-400">filter_list</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Filters:</span>
           </div>
           
           <select 
             value={filterLevel}
             onChange={(e) => setFilterLevel(e.target.value)}
             className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-600"
           >
              <option value="All">All Levels</option>
              <option value="L1">Licence 1 (L1)</option>
              <option value="L2">Licence 2 (L2)</option>
              <option value="L3">Licence 3 (L3)</option>
              <option value="M1">Master 1 (M1)</option>
              <option value="M2">Master 2 (M2)</option>
           </select>

           <select 
             value={filterType}
             onChange={(e) => setFilterType(e.target.value)}
             className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-600"
           >
              <option value="All">All Types</option>
              <option value="Core">Core</option>
              <option value="Elective">Elective</option>
           </select>

            <select 
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-600"
           >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Upcoming">Upcoming</option>
           </select>

           {(filterLevel !== 'All' || filterType !== 'All' || filterStatus !== 'All') && (
             <button 
               onClick={() => { setFilterLevel('All'); setFilterType('All'); setFilterStatus('All'); }}
               className="text-sm text-primary font-bold hover:underline ml-auto"
             >
               Clear Filters
             </button>
           )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden xl:block">
            <table className="w-full text-left border-collapse table-fixed">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[8%]">Code</th>
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[6%]">Level</th>
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[8%]">Year</th>
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[6%]">Sem</th>
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[22%]">Module Name</th>
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[16%]">Professor</th>
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[7%]">Credits</th>
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[9%]">Status</th>
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[8%]">Type</th>
                        <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-[10%]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {filteredModules.map((module) => (
                        <tr key={module.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-3 py-4">
                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded truncate block">{module.code}</span>
                            </td>
                            <td className="px-3 py-4">
                                <span className="text-xs font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded truncate block">{module.level}</span>
                            </td>
                            <td className="px-3 py-4">
                                <span className="text-xs font-bold text-slate-700 bg-amber-50 px-1.5 py-0.5 rounded truncate block">{module.academicYear}</span>
                            </td>
                            <td className="px-3 py-4">
                                <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">S{module.semester}</span>
                            </td>
                            <td className="px-3 py-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={`size-7 rounded-lg ${module.color.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center ${module.color} flex-shrink-0`}>
                                        <span className="material-symbols-outlined text-[16px]">{module.icon}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900 truncate">{module.name}</span>
                                </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-slate-600 truncate">
                                {module.professor}
                            </td>
                            <td className="px-3 py-4 text-xs text-slate-600">
                                {module.credits}
                            </td>
                            <td className="px-3 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(module.status)}`}>
                                    {module.status}
                                </span>
                            </td>
                             <td className="px-3 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${module.type === 'Core' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                    {module.type}
                                </span>
                            </td>
                            <td className="px-3 py-4 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Link 
                                      to={`/admin/modules?course=${module.id}`}
                                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                      title="View"
                                    >
                                      <span className="material-symbols-outlined text-lg">visibility</span>
                                    </Link>
                                    <button 
                                        onClick={() => handleEdit(module)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Update"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(module.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredModules.length === 0 && (
                        <tr>
                            <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                                {modules.length === 0 ? 'No modules yet. Click "Add New Module" to create one.' : 'No modules found matching your filters.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        {/* Mobile/Tablet Card View */}
        <div className="xl:hidden divide-y divide-slate-200">
            {filteredModules.map((module) => (
                <div key={module.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1">
                            <div className={`size-10 rounded-lg ${module.color.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center ${module.color} flex-shrink-0`}>
                                <span className="material-symbols-outlined text-[20px]">{module.icon}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-slate-900 truncate">{module.name}</h3>
                                <p className="text-xs text-slate-600 truncate">{module.professor}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Code:</span>
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{module.code}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Level:</span>
                            <span className="text-xs font-bold text-slate-700">{module.level}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Year:</span>
                            <span className="text-xs font-bold text-slate-700 bg-amber-50 px-1.5 py-0.5 rounded">{module.academicYear}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Sem:</span>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">S{module.semester}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Credits:</span>
                            <span className="text-xs font-bold text-slate-700">{module.credits}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Type:</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                module.type === 'Core' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>{module.type}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                            module.status === 'Active' ? 'bg-green-100 text-green-700' :
                            module.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                            {module.status}
                        </span>
                        <div className="flex gap-1">
                            <Link 
                                to={`/admin/chapters/${module.id}`}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Manage Chapters"
                            >
                                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                            </Link>
                            <button
                                onClick={() => handleEdit(module)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Edit"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                                onClick={() => handleDelete(module.id!)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-[scaleIn_0.2s_ease-out] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-bold text-slate-900">{editingModule ? 'Update Module' : 'Create Module'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Show Original Name When Editing */}
                {editingModule && (
                  <div className="sticky top-0 z-10 mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Original Name:</strong> <span className="text-blue-700">{editingModule.name}</span>
                    </p>
                  </div>
                )}

                <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
                    <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
                            <input 
                                name="code"
                                defaultValue={editingModule?.code}
                                required
                                autoFocus
                                placeholder="e.g. CS101"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Credits</label>
                            <input 
                                name="credits"
                                type="number"
                                defaultValue={editingModule?.credits}
                                required
                                placeholder="e.g. 6"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Module Name</label>
                        <input 
                            name="name"
                            defaultValue={editingModule?.name}
                            required
                            placeholder="e.g. Introduction to Programming"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Professor</label>
                        <input 
                            name="professor"
                            defaultValue={editingModule?.professor}
                            required
                            placeholder="e.g. Dr. Jane Doe"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                            <select 
                                name="type"
                                defaultValue={editingModule?.type || 'Core'}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            >
                                <option value="Core">Core</option>
                                <option value="Elective">Elective</option>
                            </select>
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Level</label>
                            <select 
                                name="level"
                                defaultValue={editingModule?.level || 'L1'}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            >
                                <option value="L1">Licence 1 (L1)</option>
                                <option value="L2">Licence 2 (L2)</option>
                                <option value="L3">Licence 3 (L3)</option>
                                <option value="M1">Master 1 (M1)</option>
                                <option value="M2">Master 2 (M2)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Academic Year *</label>
                        <input 
                            name="academicYear"
                            defaultValue={editingModule?.academicYear || '2024-2025'}
                            required
                            placeholder="e.g. 2024-2025"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                        <p className="text-xs text-slate-400">Format: YYYY-YYYY (e.g., 2023-2024)</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Semester</label>
                        <select 
                            name="semester"
                            defaultValue={editingModule?.semester || 1}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        >
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                        <select 
                            name="status"
                            defaultValue={editingModule?.status || 'Active'}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        >
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="Upcoming">Upcoming</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Teaching Language</label>
                        <select 
                            name="language"
                            defaultValue={editingModule?.language || 'fr'}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        >
                            <option value="fr">🇫🇷 Français (French)</option>
                            <option value="en">🇬🇧 English</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Language used by professor for this course year</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Color</label>
                            <select 
                                name="color"
                                defaultValue={editingModule?.color || 'text-blue-600'}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            >
                                <option value="text-blue-600">🔵 Blue</option>
                                <option value="text-red-600">🔴 Red</option>
                                <option value="text-green-600">🟢 Green</option>
                                <option value="text-yellow-600">🟡 Yellow</option>
                                <option value="text-purple-600">🟣 Purple</option>
                                <option value="text-pink-600">🩷 Pink</option>
                                <option value="text-indigo-600">🔵 Indigo</option>
                                <option value="text-orange-600">🟠 Orange</option>
                                <option value="text-teal-600">🩵 Teal</option>
                                <option value="text-cyan-600">🔵 Cyan</option>
                                <option value="text-lime-600">🟢 Lime</option>
                                <option value="text-amber-600">🟡 Amber</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Icon</label>
                            <select 
                                name="icon"
                                defaultValue={editingModule?.icon || 'book'}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            >
                                <option value="book">📚 Book</option>
                                <option value="terminal">💻 Terminal</option>
                                <option value="code">⌨️ Code</option>
                                <option value="science">🔬 Science</option>
                                <option value="calculate">🔢 Calculate</option>
                                <option value="language">🌐 Language</option>
                                <option value="psychology">🧠 Psychology</option>
                                <option value="history_edu">📜 History</option>
                                <option value="architecture">🏛️ Architecture</option>
                                <option value="biotech">🧬 Biotech</option>
                                <option value="functions">📊 Functions</option>
                                <option value="integration_instructions">⚙️ Integration</option>
                                <option value="school">🎓 School</option>
                                <option value="class">👨‍🏫 Class</option>
                                <option value="labs">🧪 Labs</option>
                                <option value="storage">💾 Storage</option>
                                <option value="analytics">📈 Analytics</option>
                                <option value="data_object">🗃️ Data</option>
                                <option value="memory">🧮 Memory</option>
                                <option value="developer_mode">👨‍💻 Developer</option>
                            </select>
                        </div>
                    </div>

                    {/* Resource Availability Section */}
                    <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            Available Resources
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    name="hasCours"
                                    defaultChecked={editingModule?.hasCours ?? true}
                                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-sm font-medium text-slate-700">Course Chapters</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    name="hasTD"
                                    defaultChecked={editingModule?.hasTD ?? false}
                                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-sm font-medium text-slate-700">TD Exercises</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    name="hasTP"
                                    defaultChecked={editingModule?.hasTP ?? false}
                                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-sm font-medium text-slate-700">TP Exercises</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    name="hasExam"
                                    defaultChecked={editingModule?.hasExam ?? false}
                                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-sm font-medium text-slate-700">Exam Archives</span>
                            </label>
                        </div>
                    </div>
                    </div>
                    
                    <div className="p-6 pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0 bg-slate-50">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-white bg-white transition-colors" disabled={saving}>Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors" disabled={saving}>
                          {saving ? 'Saving...' : 'Save Module'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Notification Dialog */}
      {notification && (
        <div className="fixed top-4 right-4 z-[60] animate-[slideInRight_0.3s_ease-out]">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <span className={`material-symbols-outlined ${
              notification.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {notification.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <p className={`font-semibold ${
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {notification.message}
            </p>
            <button 
              onClick={() => setNotification(null)}
              className={`ml-2 ${
                notification.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Fixed Floating Add Button */}
      <button
        onClick={handleAddNew}
        className="fixed bottom-8 right-8 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 flex items-center gap-3 z-40 group hover:scale-105"
        title="Add New Module"
      >
        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">add_circle</span>
        <span className="hidden sm:inline">Add New Module</span>
      </button>
    </div>
  );
};

export default AdminModules;
