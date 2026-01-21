import React, { useState, useEffect } from 'react';
import { Resource, Course } from '../types';
import { 
  getResourcesByCourseId, 
  getAllCourses,
  createResource, 
  updateResource, 
  deleteResource 
} from '../services/database.service';
import { generateChapterDescription } from '../services/ai.service';

const AdminChapters: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    chapterNumber: 1,
    description: '',
    date: new Date().toISOString().split('T')[0],
    driveUrl: ''
  });

  // Format title by replacing _ and - with spaces, but keep year ranges like 2024-2025
  const formatTitle = (title: string): string => {
    // First, protect year ranges by temporarily replacing them
    const yearPattern = /(\d{4})[-](\d{4})/g;
    const protectedYears: string[] = [];
    let tempTitle = title.replace(yearPattern, (match) => {
      const placeholder = `__YEAR${protectedYears.length}__`;
      protectedYears.push(match);
      return placeholder;
    });
    
    // Replace all _ and - with spaces
    tempTitle = tempTitle.replace(/[_-]/g, ' ');
    
    // Restore the year ranges
    protectedYears.forEach((year, index) => {
      tempTitle = tempTitle.replace(`__YEAR${index}__`, year);
    });
    
    return tempTitle;
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchResources();
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const coursesData = await getAllCourses();
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourseId) {
        setSelectedCourseId(coursesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchResources = async () => {
    if (!selectedCourseId) return;
    
    setLoading(true);
    try {
      console.log('Fetching resources for courseId:', selectedCourseId);
      const resourcesData = await getResourcesByCourseId(selectedCourseId);
      console.log('Resources fetched:', resourcesData);
      setResources(resourcesData);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setNotification({ type: 'error', message: 'Failed to load chapters' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      chapterNumber: resource.chapterNumber || 1,
      description: resource.description || '',
      date: resource.date,
      driveUrl: resource.driveUrl
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    
    try {
      await deleteResource(id);
      await fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete chapter');
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      setNotification({ type: 'error', message: 'Please enter a chapter title first' });
      return;
    }

    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    if (!selectedCourse) {
      setNotification({ type: 'error', message: 'Please select a course first' });
      return;
    }

    setGeneratingAI(true);
    try {
      const description = await generateChapterDescription(
        formData.title,
        selectedCourse.name,
        selectedCourse.professor
      );
      setFormData({ ...formData, description });
      setNotification({ type: 'success', message: 'Description generated successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Error generating description:', error);
      setNotification({ 
        type: 'error', 
        message: error.message || 'Failed to generate description. Check console for details.' 
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourseId) {
      alert('Please select a course first');
      return;
    }

    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    
    try {
      const resourceData: any = {
        title: formatTitle(formData.title), // Format title before saving
        chapterNumber: formData.chapterNumber,
        driveUrl: formData.driveUrl,
        date: formData.date,
        courseId: selectedCourseId
      };

      // Only add optional fields if they have values
      if (formData.description) {
        resourceData.description = formData.description;
      }
      
      if (selectedCourse?.academicYear) {
        resourceData.academicYear = selectedCourse.academicYear;
      }

      if (editingResource) {
        await updateResource(editingResource.id!, resourceData);
        setNotification({ type: 'success', message: 'Chapter updated successfully!' });
      } else {
        await createResource(resourceData);
        setNotification({ type: 'success', message: 'Chapter created successfully!' });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        driveUrl: ''
      });
      setIsEditing(false);
      setEditingResource(null);
      await fetchResources();
      
      // Auto-dismiss notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Error saving resource:', error);
      setNotification({ type: 'error', message: `Failed to save chapter: ${error.message || 'Unknown error'}` });
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      chapterNumber: 1,
      description: '',
      date: new Date().toISOString().split('T')[0],
      driveUrl: ''
    });
    setIsEditing(false);
    setEditingResource(null);
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage Chapters</h1>
          <p className="text-slate-500 mt-1">Add and manage course chapters/resources</p>
        </div>
      </div>

      {/* Course Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Select Course/Module
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full md:w-96 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name} ({course.level}) - {course.academicYear}
            </option>
          ))}
        </select>
        {selectedCourse && (
          <p className="text-sm text-slate-500 mt-2">
            Professor: {selectedCourse.professor} • Level: {selectedCourse.level} • Year: {selectedCourse.academicYear}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            {isEditing ? 'edit' : 'add_circle'}
          </span>
          {isEditing ? 'Edit Chapter' : 'Add New Chapter'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Chapter N° *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.chapterNumber}
                  onChange={(e) => setFormData({ ...formData, chapterNumber: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Chapter Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  autoFocus
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g., Introduction to Algorithms"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={generatingAI || !formData.title.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:cursor-not-allowed"
                  title={!formData.title.trim() ? 'Enter chapter title first' : 'Generate description with AI'}
                >
                  {generatingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      AI Generate
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Brief description of this chapter (or click AI Generate)"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <span className="material-symbols-outlined text-lg align-middle mr-1">folder</span>
                Google Drive URL *
              </label>
              <input
                type="url"
                value={formData.driveUrl}
                onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="https://drive.google.com/..."
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Add Google Drive link for students to access chapter materials
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              {isEditing ? 'Update Chapter' : 'Add Chapter'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Chapters List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">library_books</span>
            Chapters for {selectedCourse?.name || 'Selected Course'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {resources.length} chapter{resources.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-slate-500">Loading chapters...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">library_books</span>
            <p>No chapters added yet for this course.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-16">
                    N°
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Chapter Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Drive URL
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-900">{resource.chapterNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{formatTitle(resource.title)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 max-w-xs truncate">
                        {resource.description || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {resource.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={resource.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        <span className="material-symbols-outlined text-[18px]">folder</span>
                        View Drive
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(resource)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default AdminChapters;
