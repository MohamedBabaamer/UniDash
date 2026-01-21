import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Course } from '../types';
import { getAllCourses } from '../services/database.service';

const YearDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const levelParam = searchParams.get('level') as 'L1' | 'L2' | 'L3' | 'M1' | 'M2' | null;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'L1' | 'L2' | 'L3' | 'M1' | 'M2'>(levelParam || 'L1');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedYear, setSelectedYear] = useState<string>('2024-2025');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Completed' | 'Upcoming'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState<Record<string, {
    viewedChapters: Set<string>;
    viewedTD: Set<string>;
    viewedTP: Set<string>;
    viewedExams: Set<string>;
    totalChapters: number;
    totalTD: number;
    totalTP: number;
    totalExams: number;
  }>>({});

  // Load bookmarks from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bookmarkedCourses');
    if (savedBookmarks) {
      setBookmarkedCourses(new Set(JSON.parse(savedBookmarks)));
    }

    // Load progress tracking
    const savedProgress = localStorage.getItem('courseProgress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      const progressData: typeof courseProgress = {};
      
      Object.keys(parsed).forEach(courseId => {
        progressData[courseId] = {
          viewedChapters: new Set(parsed[courseId].viewedChapters || []),
          viewedTD: new Set(parsed[courseId].viewedTD || []),
          viewedTP: new Set(parsed[courseId].viewedTP || []),
          viewedExams: new Set(parsed[courseId].viewedExams || []),
          totalChapters: parsed[courseId].totalChapters || 0,
          totalTD: parsed[courseId].totalTD || 0,
          totalTP: parsed[courseId].totalTP || 0,
          totalExams: parsed[courseId].totalExams || 0,
        };
      });
      
      setCourseProgress(progressData);
    }
  }, []);

  // Save bookmarks and progress to localStorage
  useEffect(() => {
    localStorage.setItem('bookmarkedCourses', JSON.stringify([...bookmarkedCourses]));
  }, [bookmarkedCourses]);

  useEffect(() => {
    // Convert Sets to Arrays for JSON serialization
    const progressToSave: any = {};
    Object.keys(courseProgress).forEach(courseId => {
      progressToSave[courseId] = {
        viewedChapters: [...courseProgress[courseId].viewedChapters],
        viewedTD: [...courseProgress[courseId].viewedTD],
        viewedTP: [...courseProgress[courseId].viewedTP],
        viewedExams: [...courseProgress[courseId].viewedExams],
        totalChapters: courseProgress[courseId].totalChapters,
        totalTD: courseProgress[courseId].totalTD,
        totalTP: courseProgress[courseId].totalTP,
        totalExams: courseProgress[courseId].totalExams,
      };
    });
    localStorage.setItem('courseProgress', JSON.stringify(progressToSave));
  }, [courseProgress]);

  useEffect(() => {
    if (levelParam) {
      setSelectedLevel(levelParam);
    }
  }, [levelParam]);

  const toggleBookmark = (courseId: string) => {
    setBookmarkedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  // Calculate real progress based on viewed content
  const calculateCourseProgress = (courseId: string): number => {
    const progress = courseProgress[courseId];
    if (!progress) return 0;

    const totalItems = progress.totalChapters + progress.totalTD + progress.totalTP + progress.totalExams;
    if (totalItems === 0) return 0;

    const viewedItems = 
      progress.viewedChapters.size + 
      progress.viewedTD.size + 
      progress.viewedTP.size + 
      progress.viewedExams.size;

    return Math.round((viewedItems / totalItems) * 100);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setError(null);
        const coursesData = await getAllCourses();
        setCourses(coursesData);
        
        // Initialize progress tracking for all courses
        const progressData = { ...courseProgress };
        
        for (const course of coursesData) {
          if (!progressData[course.id]) {
            // Initialize with default counts - these will be updated when viewing course detail
            progressData[course.id] = {
              viewedChapters: new Set(),
              viewedTD: new Set(),
              viewedTP: new Set(),
              viewedExams: new Set(),
              totalChapters: 0,
              totalTD: 0,
              totalTP: 0,
              totalExams: 0,
            };
          }
        }
        
        setCourseProgress(progressData);
        
        // Auto-select the latest year if available
        if (coursesData.length > 0) {
          const years = [...new Set(coursesData.map(c => c.academicYear))].sort().reverse();
          if (years.length > 0 && years[0]) {
            setSelectedYear(years[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to load courses. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Get available years
  const availableYears = [...new Set(courses.map(c => c.academicYear))].sort().reverse();

  // Filter courses by selected level, semester, year, search, and status
  const filteredCourses = courses.filter(course => {
    const matchesLevel = course.level === selectedLevel;
    const matchesSemester = course.semester === selectedSemester;
    const matchesYear = course.academicYear === selectedYear;
    const matchesSearch = searchQuery === '' || 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.professor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    
    return matchesLevel && matchesSemester && matchesYear && matchesSearch && matchesStatus;
  });

  // Calculate course statistics
  const activeCourses = filteredCourses.filter(c => c.status === 'Active').length;
  const completedCourses = filteredCourses.filter(c => c.status === 'Completed').length;
  const totalCredits = filteredCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const bookmarkedCount = filteredCourses.filter(c => bookmarkedCourses.has(c.id)).length;

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-slate-500">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-300 mb-4">error</span>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Failed to Load Courses</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
               {selectedLevel === 'L1' && 'Licence 1'}
               {selectedLevel === 'L2' && 'Licence 2'}
               {selectedLevel === 'L3' && 'Licence 3'}
               {selectedLevel === 'M1' && 'Master 1'}
               {selectedLevel === 'M2' && 'Master 2'}
             </span>
             <span className="text-slate-400 font-bold text-xs uppercase tracking-wide">{selectedYear}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Computer Science & Math</h1>
        </div>
        <div className="flex gap-3">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm focus:ring-2 focus:ring-primary/20"
            >
              <option value="L1">Licence 1 (L1)</option>
              <option value="L2">Licence 2 (L2)</option>
              <option value="L3">Licence 3 (L3)</option>
              <option value="M1">Master 1 (M1)</option>
              <option value="M2">Master 2 (M2)</option>
            </select>
            {availableYears.length > 1 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm focus:ring-2 focus:ring-primary/20"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    Academic Year {year}
                  </option>
                ))}
              </select>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Curriculum PDF
            </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by name, professor, or code..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('Active')}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                filterStatus === 'Active'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('Completed')}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                filterStatus === 'Completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completed
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || filterStatus !== 'all') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-500">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:bg-primary/20 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="hover:bg-primary/20 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
              className="ml-auto text-xs font-medium text-slate-600 hover:text-primary"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8">
            <button 
              onClick={() => setSelectedSemester(1)}
              className={`relative pb-4 text-sm font-bold transition-colors ${
                selectedSemester === 1 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
                Semester 1 
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedSemester === 1 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {courses.filter(c => c.semester === 1 && c.academicYear === selectedYear).length} modules
                </span>
            </button>
            <button 
              onClick={() => setSelectedSemester(2)}
              className={`relative pb-4 text-sm font-bold transition-colors ${
                selectedSemester === 2 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
                Semester 2
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedSemester === 2 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {courses.filter(c => c.semester === 2 && c.academicYear === selectedYear).length} modules
                </span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">grid_view</span>
                      Active Modules - Semester {selectedSemester}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {filteredCourses.length} courses • {activeCourses} active • {totalCredits} credits
                  </p>
                </div>
                {filteredCourses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
                      {activeCourses} Active
                    </div>
                    {completedCourses > 0 && (
                      <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                        {completedCourses} Completed
                      </div>
                    )}
                  </div>
                )}
            </div>

            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">school</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No courses for Semester {selectedSemester}</h3>
                <p className="text-slate-500">Courses will appear here when added by administrators.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredCourses.map((course) => (
                        <div key={course.id} className={`group flex ${viewMode === 'list' ? 'flex-row items-center' : 'flex-col'} bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden`}>
                            {/* Badges */}
                            <div className="absolute top-0 right-0 p-3 flex flex-col gap-2 items-end">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${course.level === 'L1' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                    {course.level}
                                </span>
                                {course.academicYear !== selectedYear && (
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-amber-50 text-amber-600">
                                    {course.academicYear}
                                  </span>
                                )}
                            </div>

                            {/* Bookmark Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleBookmark(course.id);
                              }}
                              className="absolute top-3 left-3 size-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm transition-all z-10"
                            >
                              <span className={`material-symbols-outlined text-[20px] ${
                                bookmarkedCourses.has(course.id) ? 'text-amber-500' : 'text-slate-400'
                              }`}>
                                {bookmarkedCourses.has(course.id) ? 'bookmark' : 'bookmark_border'}
                              </span>
                            </button>

                            <div className={`flex ${viewMode === 'list' ? 'items-center gap-4 flex-1' : 'flex-col'}`}>
                                <div className={`flex ${viewMode === 'list' ? 'items-center gap-4' : 'justify-between items-start mb-4'} ${viewMode === 'grid' ? 'pr-8 pl-8' : ''}`}>
                                    <div className={`${viewMode === 'list' ? 'size-14' : 'size-12'} rounded-xl bg-slate-50 flex items-center justify-center ${course.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                                        <span className="material-symbols-outlined text-2xl">{course.icon}</span>
                                    </div>
                                    
                                    {viewMode === 'list' && (
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-slate-900 leading-tight truncate">{course.name}</h4>
                                        <p className="text-xs font-medium text-slate-500 mt-1">{course.professor}</p>
                                      </div>
                                    )}
                                </div>

                                {viewMode === 'grid' && (
                                  <div className="mb-4">
                                      <h4 className="text-lg font-bold text-slate-900 leading-tight">{course.name}</h4>
                                      <p className="text-xs font-medium text-slate-500 mt-1">{course.professor}</p>
                                  </div>
                                )}
                            </div>

                            {/* Progress Bar if Active */}
                            {course.status === 'Active' && viewMode === 'grid' && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                                        <span>Progress</span>
                                        <span>{calculateCourseProgress(course.id)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${calculateCourseProgress(course.id)}%` }}></div>
                                    </div>
                                </div>
                            )}

                            {viewMode === 'list' && course.status === 'Active' && (
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${calculateCourseProgress(course.id)}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{calculateCourseProgress(course.id)}%</span>
                              </div>
                            )}

                            <div className={`${viewMode === 'grid' ? 'mt-auto pt-4 border-t border-slate-100' : 'ml-auto'} flex gap-2`}>
                                <Link 
                                  to={`/course/${course.id}`} 
                                  className={`${viewMode === 'grid' ? 'flex-1' : ''} px-4 py-2 bg-primary hover:bg-primary/90 text-white text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1 whitespace-nowrap`}
                                >
                                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                  {viewMode === 'grid' ? 'View Course' : 'View'}
                                </Link>
                            </div>
                        </div>
                      ))}
              </div>
            )}
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-1 space-y-6">
             {/* Upcoming Widget */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Upcoming</h3>
                <div className="space-y-4">
                    <div className="flex gap-3 items-start">
                        <div className="flex flex-col items-center justify-center bg-red-50 text-red-600 rounded-lg w-12 h-12 flex-shrink-0">
                            <span className="text-xs font-bold uppercase">Oct</span>
                            <span className="text-lg font-bold leading-none">24</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 line-clamp-1">Algorithms Mid-term</p>
                            <p className="text-xs text-slate-500">10:00 AM • Room 301</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                         <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-600 rounded-lg w-12 h-12 flex-shrink-0">
                            <span className="text-xs font-bold uppercase">Oct</span>
                            <span className="text-lg font-bold leading-none">28</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 line-clamp-1">Web Tech Project</p>
                            <p className="text-xs text-slate-500">Submission deadline</p>
                        </div>
                    </div>
                </div>
                <button className="w-full mt-5 py-2 text-sm font-medium text-slate-600 hover:text-primary border border-slate-200 rounded-lg transition-colors">
                    View Full Schedule
                </button>
            </div>

            {/* Resources Widget */}
            <div className="bg-primary rounded-2xl shadow-lg shadow-blue-500/20 p-5 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined">school</span>
                        <h3 className="text-lg font-bold">Study Resources</h3>
                    </div>
                    <p className="text-sm text-blue-100 mb-4">Access the central library database for extra papers.</p>
                    <button className="inline-flex items-center justify-center w-full py-2 bg-white text-primary text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors">
                        Browse Library
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default YearDashboard;