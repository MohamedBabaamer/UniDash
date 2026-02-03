import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  const [sortBy, setSortBy] = useState<'code'|'name'|'professor'|'credits'>('code');
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);
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

  // Extract all academic year ranges from courses
  const getAllAcademicYears = (courses: Course[]): string[] => {
    const yearsSet = new Set<string>();
    
    courses.forEach(course => {
      if (!course.academicYear) return;
      
      const parts = course.academicYear.split('-');
      if (parts.length === 2) {
        const startYear = parseInt(parts[0]);
        const endYear = parseInt(parts[1]);
        
        // If it's a single academic year (e.g., "2023-2024")
        if (endYear - startYear === 1) {
          yearsSet.add(course.academicYear);
        } else {
          // If it's a range (e.g., "2020-2023"), generate all academic years
          for (let year = startYear; year < endYear; year++) {
            yearsSet.add(`${year}-${year + 1}`);
          }
        }
      }
    });
    
    return Array.from(yearsSet).sort().reverse();
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
        
        // Auto-select the latest academic year if available
        if (coursesData.length > 0) {
          const years = getAllAcademicYears(coursesData);
          if (years.length > 0) {
            setSelectedYear(years[0]); // Most recent academic year
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

  // Get available academic years from all courses
  const availableYears = getAllAcademicYears(courses);

  const { isAdmin } = useAuth();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };


  // Check if two academic year ranges intersect
  const academicYearsIntersect = (year1: string, year2: string): boolean => {
    const parts1 = year1.split('-');
    const parts2 = year2.split('-');
    
    if (parts1.length !== 2 || parts2.length !== 2) return false;
    
    const start1 = parseInt(parts1[0]);
    const end1 = parseInt(parts1[1]);
    const start2 = parseInt(parts2[0]);
    const end2 = parseInt(parts2[1]);
    
    // Check for intersection: ranges overlap if start1 < end2 && start2 < end1
    // This ensures years like 2022-2023 and 2023-2024 don't intersect
    return start1 < end2 && start2 < end1;
  };

  // Filter courses by selected level, semester, year, search, and status
  let filteredCourses = courses.filter(course => {
    const matchesLevel = course.level === selectedLevel;
    const matchesSemester = course.semester === selectedSemester;
    // Check if selected year intersects with course's academicYear
    const matchesYear = academicYearsIntersect(selectedYear, course.academicYear);
    const matchesSearch = searchQuery === '' || 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.professor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    
    return matchesLevel && matchesSemester && matchesYear && matchesSearch && matchesStatus;
  });

  if (bookmarkedOnly) {
    filteredCourses = filteredCourses.filter(c => bookmarkedCourses.has(c.id));
  }

  // Apply sorting
  const displayCourses = [...filteredCourses].sort((a,b) => {
    if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'professor') return (a.professor || '').localeCompare(b.professor || '');
    return (b.credits || 0) - (a.credits || 0);
  });

  // CSV export for currently displayed courses
  const exportCoursesCSV = () => {
    const rows = displayCourses.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      professor: c.professor,
      level: c.level,
      semester: c.semester,
      academicYear: c.academicYear,
      credits: c.credits,
      status: c.status,
    }));
    const header = Object.keys(rows[0] || {}).join(',') + '\n';
    const csv = header + rows.map(r => Object.values(r).map(v => `"${String(v || '')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses_${selectedLevel}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derived relations for sidebar based on displayed courses
  const bookmarkedList = displayCourses.filter(c => bookmarkedCourses.has(c.id));

  const professorsMap: Record<string, Course[]> = {};
  displayCourses.forEach(c => {
    const key = c.professor || 'Unknown';
    if (!professorsMap[key]) professorsMap[key] = [];
    professorsMap[key].push(c);
  });

  const topProfessors = Object.keys(professorsMap)
    .map(p => ({ name: p, count: professorsMap[p].length }))
    .sort((a,b) => b.count - a.count)
    .slice(0, 8);

  // Calculate course statistics
  const activeCourses = filteredCourses.filter(c => c.status === 'Active').length;
  const completedCourses = filteredCourses.filter(c => c.status === 'Completed').length;
  const totalCredits = filteredCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const bookmarkedCount = filteredCourses.filter(c => bookmarkedCourses.has(c.id)).length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 z-50 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
              <span className="material-symbols-outlined text-7xl text-primary animate-bounce">
                dashboard
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
              Loading Dashboard
            </h2>
            <p className="text-slate-500 font-medium">
              Preparing your courses...
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Computer Science & Math</h1>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="px-3 sm:px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm focus:ring-2 focus:ring-primary/20"
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
                className="px-3 sm:px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm focus:ring-2 focus:ring-primary/20"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}
            <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">download</span>
                <span className="hidden sm:inline">Curriculum PDF</span>
                <span className="sm:hidden">PDF</span>
            </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] sm:text-[20px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">close</span>
              </button>
            )}
          </div>

          {/* Filter and View Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('Active')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                filterStatus === 'Active'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm"
            >
              <option value="code">Sort: Code</option>
              <option value="name">Sort: Name</option>
              <option value="professor">Sort: Professor</option>
              <option value="credits">Sort: Credits</option>
            </select>

            <button
              onClick={() => setBookmarkedOnly(prev => !prev)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${bookmarkedOnly ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {bookmarkedOnly ? 'Bookmarked' : 'All'}
            </button>

            <button
              onClick={() => exportCoursesCSV()}
              className="ml-auto px-3 sm:px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined">file_download</span>
              <span className="ml-2 hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setFilterStatus('Completed')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                filterStatus === 'Completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completed
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid view"
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="List view"
              >
                <span className="material-symbols-outlined text-[20px]">view_list</span>
              </button>
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">grid_view</span>
                      <span>Active Modules - Semester {selectedSemester}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {filteredCourses.length} courses • {activeCourses} active • {totalCredits} credits
                  </p>
                </div>
                {filteredCourses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] sm:text-xs font-bold">
                      {activeCourses} Active
                    </div>
                    {completedCourses > 0 && (
                      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] sm:text-xs font-bold">
                        {completedCourses} Completed
                      </div>
                    )}
                  </div>
                )}
            </div>

            {filteredCourses.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl sm:text-6xl text-slate-300 mb-2 sm:mb-4">school</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 sm:mb-2">No courses for Semester {selectedSemester}</h3>
                <p className="text-sm sm:text-base text-slate-500">Courses will appear here when added by administrators.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3 sm:space-y-4'}>
                  {displayCourses.map((course) => (
                        <div key={course.id} className={`group flex ${viewMode === 'list' ? 'flex-col xs:flex-row xs:items-center' : 'flex-col'} bg-white rounded-xl sm:rounded-2xl ${viewMode === 'list' ? 'p-3 sm:p-4' : 'p-4 sm:p-5'} border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 relative`}>
                            {/* Badges */}
                            {viewMode === 'grid' ? (
                              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-col gap-1 sm:gap-2 items-end z-10">
                                  <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-sm ${course.level === 'L1' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
                                      {course.level}
                                  </span>
                                  {course.academicYear !== selectedYear && (
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                      {course.academicYear}
                                    </span>
                                  )}
                              </div>
                            ) : null}

                            {/* Bookmark Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleBookmark(course.id);
                              }}
                              className={`absolute ${viewMode === 'list' ? 'top-2 left-2 size-6 sm:size-7' : 'top-2 sm:top-3 left-2 sm:left-3 size-7 sm:size-8'} flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm transition-all z-10`}
                            >
                              <span className={`material-symbols-outlined ${viewMode === 'list' ? 'text-[16px] sm:text-[18px]' : 'text-[18px] sm:text-[20px]'} ${
                                bookmarkedCourses.has(course.id) ? 'text-amber-500' : 'text-slate-400'
                              }`}>
                                {bookmarkedCourses.has(course.id) ? 'bookmark' : 'bookmark_border'}
                              </span>
                            </button>

                            <div className={`flex ${viewMode === 'list' ? 'flex-col xs:flex-row xs:items-center gap-2 sm:gap-3 flex-1 pl-7 xs:pl-7 sm:pl-8 pt-8 xs:pt-0' : 'flex-col'}`}>
                                <div className={`flex ${viewMode === 'list' ? 'items-center gap-2 sm:gap-3' : 'justify-between items-start mb-3 sm:mb-4'} ${viewMode === 'grid' ? 'pr-6 sm:pr-8 pl-6 sm:pl-8' : ''}`}>
                                    <div className={`${viewMode === 'list' ? 'size-10 sm:size-12' : 'size-11 sm:size-12'} rounded-lg sm:rounded-xl bg-slate-50 flex items-center justify-center ${course.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                                        <span className={`material-symbols-outlined ${viewMode === 'list' ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>{course.icon}</span>
                                    </div>
                                    
                                    {viewMode === 'list' && (
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">{course.name}</h4>
                                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5 truncate">{course.professor}</p>
                                      </div>
                                    )}
                                </div>

                                {viewMode === 'grid' && (
                                  <div className="mb-3 sm:mb-4">
                                      <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight line-clamp-2">{course.name}</h4>
                                      <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 truncate">{course.professor}</p>
                                  </div>
                                )}
                            </div>

                            {/* Progress Bar if Active */}
                            {course.status === 'Active' && viewMode === 'grid' && (
                                <div className="mb-3 sm:mb-4">
                                    <div className="flex justify-between text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 mb-1">
                                        <span>Progress</span>
                                        <span>{calculateCourseProgress(course.id)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${calculateCourseProgress(course.id)}%` }}></div>
                                    </div>
                                </div>
                            )}

                            {viewMode === 'list' && course.status === 'Active' && (
                              <div className="flex items-center gap-2 sm:gap-3 w-full xs:w-auto xs:min-w-[120px] sm:min-w-[150px]">
                                <div className="flex-1 h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${calculateCourseProgress(course.id)}%` }}></div>
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-600 whitespace-nowrap">{calculateCourseProgress(course.id)}%</span>
                              </div>
                            )}

                            {viewMode === 'list' && (
                              <div className="flex items-center gap-2 flex-shrink-0 w-full xs:w-auto justify-between xs:justify-start">
                                <div className="flex items-center gap-1">
                                  <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-sm ${course.level === 'L1' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
                                    {course.level}
                                  </span>
                                  {course.academicYear !== selectedYear && (
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                      {course.academicYear}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link 
                                    to={`/course/${course.id}`} 
                                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-primary hover:bg-primary/90 text-white text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1 whitespace-nowrap"
                                  >
                                    <span className="material-symbols-outlined text-[12px] sm:text-[14px]">arrow_forward</span>
                                    <span>View</span>
                                  </Link>
                                  {/* Admin 'Manage' button removed - View opens course detail */}
                                  <button
                                    onClick={(e) => { e.preventDefault(); copyToClipboard(window.location.origin + `/course/${course.id}`); }}
                                    className="px-2 py-1 bg-slate-100 rounded-lg text-slate-700 text-[10px] hover:bg-slate-200"
                                    title="Copy course link"
                                  >
                                    <span className="material-symbols-outlined">link</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {viewMode === 'grid' && (
                              <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-100 flex gap-1.5 sm:gap-2">
                                  <div className="flex-1 flex gap-2">
                                    <Link 
                                      to={`/course/${course.id}`} 
                                      className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary/90 text-white text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1 whitespace-nowrap"
                                    >
                                      <span className="material-symbols-outlined text-[12px] sm:text-[14px]">arrow_forward</span>
                                      <span>View Course</span>
                                    </Link>
                                    {/* Admin 'Manage' icon removed from grid view */}
                                    <button
                                      onClick={(e) => { e.preventDefault(); copyToClipboard(window.location.origin + `/course/${course.id}`); }}
                                      className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700 text-[10px] hover:bg-slate-200"
                                      title="Copy course link"
                                    >
                                      <span className="material-symbols-outlined">link</span>
                                    </button>
                                  </div>
                              </div>
                            )}
                        </div>
                      ))}
              </div>
            )}
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
             {/* Upcoming Widget */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg sm:text-xl">event</span>
                  <span>Upcoming</span>
                </h3>
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex gap-2 sm:gap-3 items-start">
                        <div className="flex flex-col items-center justify-center bg-red-50 text-red-600 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                            <span className="text-[10px] sm:text-xs font-bold uppercase">Oct</span>
                            <span className="text-base sm:text-lg font-bold leading-none">24</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">Algorithms Mid-term</p>
                            <p className="text-[10px] sm:text-xs text-slate-500">10:00 AM • Room 301</p>
                        </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 items-start">
                         <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-600 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                            <span className="text-[10px] sm:text-xs font-bold uppercase">Oct</span>
                            <span className="text-base sm:text-lg font-bold leading-none">28</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">Web Tech Project</p>
                            <p className="text-[10px] sm:text-xs text-slate-500">Submission deadline</p>
                        </div>
                    </div>
                </div>
                <button className="w-full mt-4 sm:mt-5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-primary border border-slate-200 rounded-lg transition-colors">
                    View Full Schedule
                </button>
            </div>

            {/* Bookmarked Courses Widget */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg sm:text-xl">bookmark</span>
                  <span>Bookmarked</span>
                </h3>
                {bookmarkedList.length === 0 ? (
                  <p className="text-sm text-slate-500">No bookmarked courses in current view.</p>
                ) : (
                  <div className="space-y-2">
                    {bookmarkedList.slice(0,6).map(c => (
                      <div key={c.id} className="flex items-center justify-between">
                        <Link to={`/course/${c.id}`} className="text-sm text-slate-800 truncate">{c.code} — {c.name}</Link>
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyToClipboard(window.location.origin + `/course/${c.id}`)} className="text-slate-400 hover:text-slate-600" title="Copy link">
                            <span className="material-symbols-outlined">link</span>
                          </button>
                          <button onClick={() => { toggleBookmark(c.id); }} className="text-amber-500" title="Remove bookmark">
                            <span className="material-symbols-outlined">bookmark_remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {bookmarkedList.length > 6 && (
                      <Link to="#" className="text-sm text-primary font-medium">View all bookmarks</Link>
                    )}
                  </div>
                )}
            </div>

            {/* Professors Widget */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg sm:text-xl">person</span>
                  <span>Professors</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {topProfessors.map(p => (
                    <button key={p.name} onClick={() => { setSearchQuery(p.name); }} className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-700 text-left">{p.name} <span className="text-xs text-slate-500 ml-2">{p.count}</span></button>
                  ))}
                </div>
            </div>

            {/* Quick Levels Widget */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg sm:text-xl">layers</span>
                  <span>Quick Levels</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['L1','L2','L3','M1','M2'].map(l => (
                    <button key={l} onClick={() => setSelectedLevel(l as any)} className={`px-3 py-1 rounded-lg text-sm ${selectedLevel===l ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'}`}>{l}</button>
                  ))}
                </div>
            </div>

            {/* Resources Widget */}
            <div className="bg-primary rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/20 p-4 sm:p-5 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-xl sm:text-2xl">school</span>
                        <h3 className="text-base sm:text-lg font-bold">Study Resources</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-100 mb-3 sm:mb-4">Access the central library database for extra papers.</p>
                    <button className="inline-flex items-center justify-center w-full py-2 bg-white text-primary text-xs sm:text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors">
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