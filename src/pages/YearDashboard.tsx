import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Course, Exam } from '../types';
import { getAllCourses, getExamsByCourseId } from '../services/database.service';

const YearDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const levelParam = searchParams.get('level') as 'L1' | 'L2' | 'L3' | 'M1' | 'M2' | null;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<'L1' | 'L2' | 'L3' | 'M1' | 'M2'>(levelParam || 'L1');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedYear, setSelectedYear] = useState<string>('2024-2025');
  const [selectedCourseExams, setSelectedCourseExams] = useState<{course: Course, exams: Exam[]} | null>(null);
  const [loadingExams, setLoadingExams] = useState(false);

  useEffect(() => {
    if (levelParam) {
      setSelectedLevel(levelParam);
    }
  }, [levelParam]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await getAllCourses();
        setCourses(coursesData);
        // Auto-select the latest year if available
        if (coursesData.length > 0) {
          const years = [...new Set(coursesData.map(c => c.academicYear))].sort().reverse();
          if (years.length > 0 && years[0]) {
            setSelectedYear(years[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleOpenExams = async (course: Course) => {
    setLoadingExams(true);
    try {
      const examsData = await getExamsByCourseId(course.id);
      setSelectedCourseExams({ course, exams: examsData });
    } catch (error) {
      console.error('Error fetching exams:', error);
      setSelectedCourseExams({ course, exams: [] });
    } finally {
      setLoadingExams(false);
    }
  };

  const closeExamModal = () => {
    setSelectedCourseExams(null);
  };

  // Get available years
  const availableYears = [...new Set(courses.map(c => c.academicYear))].sort().reverse();

  // Filter courses by selected level, semester and year
  const filteredCourses = courses.filter(course => 
    course.level === selectedLevel && 
    course.semester === selectedSemester && 
    course.academicYear === selectedYear
  );

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
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">grid_view</span>
                    Active Modules - Semester {selectedSemester}
                </h3>
                <span className="text-sm text-slate-500">Showing {filteredCourses.length} courses</span>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">school</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No courses for Semester {selectedSemester}</h3>
                <p className="text-slate-500">Courses will appear here when added by administrators.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                      <div key={course.id} className="group flex flex-col bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                          {/* Level Badge */}
                          <div className="absolute top-0 right-0 p-3">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${course.level === 'L1' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                  {course.level}
                              </span>
                          </div>

                          <div className="flex justify-between items-start mb-4 pr-8">
                              <div className="flex gap-4">
                                  <div className={`size-12 rounded-xl bg-slate-50 flex items-center justify-center ${course.color} group-hover:scale-110 transition-transform`}>
                                      <span className="material-symbols-outlined text-2xl">{course.icon}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="mb-4">
                              <h4 className="text-lg font-bold text-slate-900 leading-tight">{course.name}</h4>
                              <p className="text-xs font-medium text-slate-500 mt-1">{course.professor}</p>
                          </div>

                          {/* Progress Bar if Active */}
                          {course.status === 'Active' && (
                              <div className="mb-4">
                                  <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                                      <span>Progress</span>
                                      <span>{course.progress}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-primary rounded-full" style={{ width: `${course.progress}%` }}></div>
                                  </div>
                              </div>
                          )}

                          <div className="mt-auto pt-4 border-t border-slate-100">
                              <Link 
                                to={`/course/${course.id}`} 
                                className="w-full px-2 py-2 bg-primary hover:bg-primary/90 text-white text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm flex items-center justify-center"
                              >
                                View Course
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

      {/* Exam Archive Modal */}
      {selectedCourseExams && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             {/* Backdrop */}
             <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={closeExamModal}
             ></div>

             {/* Modal Content */}
             <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                 <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-lg flex items-center justify-center ${selectedCourseExams.course.color.replace('text-', 'bg-').replace('600', '100')} ${selectedCourseExams.course.color}`}>
                             <span className="material-symbols-outlined">{selectedCourseExams.course.icon}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 leading-none">{selectedCourseExams.course.name}</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Exam Archives</p>
                        </div>
                    </div>
                    <button onClick={closeExamModal} className="size-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>

                 <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loadingExams ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="mt-4 text-slate-500 text-sm">Loading exams...</p>
                        </div>
                    ) : selectedCourseExams.exams.length > 0 ? (
                        <div className="space-y-3">
                            {selectedCourseExams.exams.map((exam) => (
                                <div key={exam.id} className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:shadow-md transition-all bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center bg-slate-100 text-slate-600 rounded-lg size-10 flex-shrink-0">
                                            <span className="material-symbols-outlined">description</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">{exam.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                                    exam.type === 'Midterm' ? 'bg-orange-50 text-orange-600' :
                                                    exam.type === 'Final' ? 'bg-red-50 text-red-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {exam.type}
                                                </span>
                                                <span className="text-xs text-slate-400">• {exam.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <a href={exam.url} target="_blank" rel="noopener noreferrer" className="size-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors">
                                        <span className="material-symbols-outlined">download</span>
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2">folder_off</span>
                            <p className="text-sm">No exam papers found for this course.</p>
                        </div>
                    )}
                 </div>

                 <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                     <button onClick={closeExamModal} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors">
                         Close
                     </button>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default YearDashboard;