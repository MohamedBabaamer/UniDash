import React, { useState, useEffect } from 'react';
import { Resource, Course } from '../types';
import { 
  getResourcesByCourseId, 
  getAllCourses,
  createResource, 
  updateResource, 
  deleteResource 
} from '../services/database.service';

const AdminChapters: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showWarning, setShowWarning] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    chapterNumber: 1,
    description: '',
    date: new Date().toISOString().split('T')[0],
    driveUrl: '',
    resourceType: 'chapter' as 'chapter' | 'book'
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
      driveUrl: resource.driveUrl,
      resourceType: (resource as any).resourceType || 'chapter'
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    
    try {
      await deleteResource(id);
      setNotification({ type: 'success', message: 'Chapter deleted successfully!' });
      await fetchResources();
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting resource:', error);
      setNotification({ type: 'error', message: 'Failed to delete chapter' });
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
        courseId: selectedCourseId,
        resourceType: formData.resourceType
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
        chapterNumber: 1,
        description: '',
        date: new Date().toISOString().split('T')[0],
        driveUrl: '',
        resourceType: 'chapter'
      });
      setIsEditing(false);
      setEditingResource(null);
      setIsModalOpen(false);
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
      driveUrl: '',
      resourceType: 'chapter'
    });
    setIsEditing(false);
    setEditingResource(null);
    setIsModalOpen(false);
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
          <>
            {/* Desktop Table View */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-16">
                    Type
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-16">
                    N°
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Title
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
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        (resource as any).resourceType === 'book' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {(resource as any).resourceType === 'book' ? '📚 Book' : '📄 Ch'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-900">
                        {(resource as any).resourceType === 'book' ? '—' : resource.chapterNumber}
                      </div>
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
          
          {/* Mobile Card View */}
          <div className="xl:hidden divide-y divide-slate-200">
            {resources.map((resource) => (
              <div key={resource.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${
                    (resource as any).resourceType === 'book' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {(resource as any).resourceType === 'book' ? '📚 Book' : '📄 Ch'}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700 flex-shrink-0">
                    #{resource.chapterNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mb-1">{resource.description}</p>
                    )}
                    {resource.date && (
                      <p className="text-[10px] text-slate-500">
                        {new Date(resource.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={resource.driveUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">folder</span>
                    <span>View Drive</span>
                  </a>
                  <button
                    onClick={() => handleEdit(resource)}
                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Fixed Floating Add Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-xl flex items-center gap-2 z-40"
        title="Add New Chapter"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
        <span className="hidden md:inline">Add Chapter</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-[scaleIn_0.2s_ease-out] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  {isEditing ? 'edit' : 'add_circle'}
                </span>
                {isEditing ? 'Edit Chapter/Book' : 'Add New Chapter/Book'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Show Original Title When Editing */}
            {isEditing && editingResource && (
              <div className="sticky top-0 z-10 mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Original Title:</strong> <span className="text-blue-700">{editingResource.title}</span>
                </p>
              </div>
            )}

            {/* Important Notice - Dismissable */}
            {showWarning && (
              <div 
                onClick={() => setShowWarning(false)}
                className="mx-6 mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                title="Click to dismiss"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-600 text-2xl flex-shrink-0">
                    warning
                  </span>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 mb-1">⚠️ Important: Make file public</h4>
                    <p className="text-sm text-red-800">
                      Right-click file → Share → Change to "Anyone with the link"
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      This prevents login prompts for students.
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-red-400 text-sm">
                    close
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Resource Type Selector */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Resource Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="resourceType"
                        value="chapter"
                        checked={formData.resourceType === 'chapter'}
                        onChange={(e) => setFormData({ ...formData, resourceType: 'chapter' })}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        📄 Individual Chapter
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="resourceType"
                        value="book"
                        checked={formData.resourceType === 'book'}
                        onChange={(e) => setFormData({ ...formData, resourceType: 'book' })}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        📚 Full Course Book (Polycopié)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Chapter N° {formData.resourceType === 'book' && <span className="text-slate-400 font-normal">(optional)</span>}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.chapterNumber}
                      onChange={(e) => setFormData({ ...formData, chapterNumber: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required={formData.resourceType === 'chapter'}
                      disabled={formData.resourceType === 'book'}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {formData.resourceType === 'chapter' ? 'Chapter Title' : 'Book Title'} *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      autoFocus
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder={formData.resourceType === 'chapter' ? 'e.g., Introduction to Algorithms' : 'e.g., Polycopié Complet du Cours'}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Brief description"
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
                </div>
              </div>

              <div className="p-6 pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0 bg-slate-50">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {isEditing ? 'Update' : 'Create'}
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
    </div>
  );
};

export default AdminChapters;
