import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCourseById,
  getResourcesByCourseId,
  getSeriesByCourseId,
} from "../services/database.service";
import { Course, Resource, Series } from "../types/index";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase.config";
import SecurePDFViewer from "../components/SecurePDFViewer";

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalExamDate, setGlobalExamDate] = useState<string | null>(null);
  const [examSettingsEnabled, setExamSettingsEnabled] = useState(true);
  const [viewingPDF, setViewingPDF] = useState<{ url: string; title: string } | null>(null);
  const [courseProgress, setCourseProgress] = useState({
    viewedChapters: new Set<string>(),
    viewedTD: new Set<string>(),
    viewedTP: new Set<string>(),
    viewedExams: new Set<string>(),
  });

  useEffect(() => {
    if (id) {
      fetchCourseData();
      fetchGlobalExamSettings();
      
      // Load progress for this course
      const savedProgress = localStorage.getItem('courseProgress');
      if (savedProgress) {
        const allProgress = JSON.parse(savedProgress);
        if (allProgress[id]) {
          setCourseProgress({
            viewedChapters: new Set(allProgress[id].viewedChapters || []),
            viewedTD: new Set(allProgress[id].viewedTD || []),
            viewedTP: new Set(allProgress[id].viewedTP || []),
            viewedExams: new Set(allProgress[id].viewedExams || []),
          });
        }
      }
    }
  }, [id]);

  const fetchGlobalExamSettings = async () => {
    try {
      const docRef = doc(db, "settings", "examSettings");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalExamDate(data.globalExamDate);
        setExamSettingsEnabled(data.isEnabled ?? true);
      } else {
        // No settings configured yet - solutions unlocked by default
        setExamSettingsEnabled(false);
      }
    } catch (error) {
      console.error("Error fetching exam settings:", error);
      // On error, disable locking (fail open)
      setExamSettingsEnabled(false);
    }
  };

  const fetchCourseData = async () => {
    if (!id) {
      console.log("❌ No course ID provided");
      return;
    }

    console.log("🔍 Fetching course data for ID:", id);
    setLoading(true);
    try {
      const [courseData, resourcesData, seriesData] = await Promise.all([
        getCourseById(id),
        getResourcesByCourseId(id),
        getSeriesByCourseId(id),
      ]);

      console.log("📚 Course data fetched:", courseData);
      console.log("📖 Resources fetched:", resourcesData.length, "items");
      console.log("📝 Series fetched:", seriesData.length, "items");

      setCourse(courseData);
      setResources(resourcesData);
      setSeries(seriesData);
      
      // Update total counts in localStorage
      if (id) {
        const savedProgress = localStorage.getItem('courseProgress');
        const allProgress = savedProgress ? JSON.parse(savedProgress) : {};
        
        if (!allProgress[id]) {
          allProgress[id] = {
            viewedChapters: [],
            viewedTD: [],
            viewedTP: [],
            viewedExams: [],
          };
        }
        
        allProgress[id].totalChapters = resourcesData.length;
        allProgress[id].totalTD = seriesData.filter(s => s.type === 'TD').length;
        allProgress[id].totalTP = seriesData.filter(s => s.type === 'TP').length;
        allProgress[id].totalExams = seriesData.filter(s => s.type === 'Exam').length;
        
        localStorage.setItem('courseProgress', JSON.stringify(allProgress));
      }
    } catch (error) {
      console.error("❌ Error fetching course data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelName = (level: string) => {
    const levelMap: Record<string, string> = {
      L1: "Licence 1",
      L2: "Licence 2",
      L3: "Licence 3",
      M1: "Master 1",
      M2: "Master 2",
    };
    return levelMap[level] || level;
  };

  // Format title by replacing _ and - with spaces
  const formatTitle = (title: string): string => {
    return title.replace(/[_-]/g, ' ');
  };

  const openDriveUrl = (url: string, title: string = "Document", itemId?: string, itemType?: 'chapter' | 'TD' | 'TP' | 'exam') => {
    setViewingPDF({ url, title });
    
    // Mark as viewed
    if (id && itemId && itemType) {
      const savedProgress = localStorage.getItem('courseProgress');
      const allProgress = savedProgress ? JSON.parse(savedProgress) : {};
      
      if (!allProgress[id]) {
        allProgress[id] = {
          viewedChapters: [],
          viewedTD: [],
          viewedTP: [],
          viewedExams: [],
          totalChapters: resources.length,
          totalTD: series.filter(s => s.type === 'TD').length,
          totalTP: series.filter(s => s.type === 'TP').length,
          totalExams: series.filter(s => s.type === 'Exam').length,
        };
      }
      
      // Add to appropriate viewed list
      switch(itemType) {
        case 'chapter':
          if (!allProgress[id].viewedChapters.includes(itemId)) {
            allProgress[id].viewedChapters.push(itemId);
          }
          setCourseProgress(prev => ({
            ...prev,
            viewedChapters: new Set([...prev.viewedChapters, itemId])
          }));
          break;
        case 'TD':
          if (!allProgress[id].viewedTD.includes(itemId)) {
            allProgress[id].viewedTD.push(itemId);
          }
          setCourseProgress(prev => ({
            ...prev,
            viewedTD: new Set([...prev.viewedTD, itemId])
          }));
          break;
        case 'TP':
          if (!allProgress[id].viewedTP.includes(itemId)) {
            allProgress[id].viewedTP.push(itemId);
          }
          setCourseProgress(prev => ({
            ...prev,
            viewedTP: new Set([...prev.viewedTP, itemId])
          }));
          break;
        case 'exam':
          if (!allProgress[id].viewedExams.includes(itemId)) {
            allProgress[id].viewedExams.push(itemId);
          }
          setCourseProgress(prev => ({
            ...prev,
            viewedExams: new Set([...prev.viewedExams, itemId])
          }));
          break;
      }
      
      localStorage.setItem('courseProgress', JSON.stringify(allProgress));
    }
  };

  // Filter series by type and sort alphabetically by title
  const tdSeries = series
    .filter((s) => s.type === "TD")
    .sort((a, b) => a.title.localeCompare(b.title));
  const tpSeries = series
    .filter((s) => s.type === "TP")
    .sort((a, b) => a.title.localeCompare(b.title));
  const pwSeries = series
    .filter((s) => s.type === "PW")
    .sort((a, b) => a.title.localeCompare(b.title));
  const examSeries = series
    .filter((s) => s.type === "Exam")
    .sort((a, b) => a.title.localeCompare(b.title));

  // Filter resources into chapters and full course books
  const chapters = resources.filter((r) => !(r as any).resourceType || (r as any).resourceType === 'chapter');
  const books = resources.filter((r) => (r as any).resourceType === 'book');

  // Helper to check if exam should be excluded (TW or Rattrapage)
  const shouldExcludeExam = (title: string): boolean => {
    const titleLower = title.toLowerCase();
    
    // Check for TW variations (Tutorial Work - English)
    // Matches: "TW", "Exam TW", "TW Exam", etc.
    const hasTW = titleLower.includes(' tw ') || 
                  titleLower.includes(' tw') || 
                  titleLower.includes('tw ') ||
                  titleLower === 'tw' ||
                  titleLower.startsWith('tw ') ||
                  titleLower.endsWith(' tw') ||
                  /\btw\b/i.test(title); // Word boundary check (case-insensitive)
    
    // Check for Rattrapage (French: "Rattrapage", "Rattrap") and English equivalents
    // Matches: "Rattrapage", "Exam Rattrapage", "Makeup", "Make-up", "Resit"
    const hasRattrapage = titleLower.includes('rattrapage') || 
                          titleLower.includes('rattrap') ||
                          titleLower.includes('makeup') ||
                          titleLower.includes('make-up') ||
                          titleLower.includes('make up') ||
                          titleLower.includes('resit') ||
                          titleLower.includes('re-sit');
    
    return hasTW || hasRattrapage;
  };

  // Group exams by type (Final, TD, TP, Devoir, Rattrapage) - Support French & English
  const examFinalSeries = examSeries.filter((s) => {
    const titleLower = s.title.toLowerCase();
    return (titleLower.includes('final') || titleLower.includes('finale'));
  });
  const examTDSeries = examSeries.filter((s) => {
    const titleLower = s.title.toLowerCase();
    return (titleLower.includes('td') || titleLower.includes('tw')) && !(titleLower.includes('final') || titleLower.includes('finale'));
  });
  const examTPSeries = examSeries.filter((s) => {
    const titleLower = s.title.toLowerCase();
    return (titleLower.includes('tp') || titleLower.includes('pw')) && !(titleLower.includes('final') || titleLower.includes('finale'));
  });
  const examDevoirSeries = examSeries.filter((s) => {
    const titleLower = s.title.toLowerCase();
    return titleLower.includes('devoir') && !(titleLower.includes('final') || titleLower.includes('finale'));
  });
  const examRattrapageSeries = examSeries.filter((s) => {
    const titleLower = s.title.toLowerCase();
    return (titleLower.includes('rattrapage') || titleLower.includes('rattrap') || titleLower.includes('makeup') || titleLower.includes('make-up') || titleLower.includes('resit')) && !(titleLower.includes('final') || titleLower.includes('finale'));
  });

  // Check if solutions should be unlocked using global exam date
  const areSolutionsUnlocked =
    !examSettingsEnabled ||
    !globalExamDate ||
    new Date() >= new Date(globalExamDate);

  const getUnlockDateMessage = () => {
    if (!globalExamDate) return "";
    return new Date(globalExamDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate real progress based on viewed content
  const calculateProgress = (): number => {
    const totalChapters = resources.length;
    const totalTD = tdSeries.length;
    const totalTP = tpSeries.length;
    const totalExams = examSeries.length;
    
    const totalItems = totalChapters + totalTD + totalTP + totalExams;
    if (totalItems === 0) return 0;

    const viewedItems = 
      courseProgress.viewedChapters.size + 
      courseProgress.viewedTD.size + 
      courseProgress.viewedTP.size + 
      courseProgress.viewedExams.size;

    return Math.round((viewedItems / totalItems) * 100);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 z-50 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
              <span className="material-symbols-outlined text-7xl text-primary animate-bounce">
                menu_book
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
              Loading Course Details
            </h2>
            <p className="text-slate-500 font-medium">
              Preparing your content...
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

  if (!course) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-200">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
            error
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Course Not Found
          </h2>
          <p className="text-slate-500 mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Determine which sections to show (after course null check)
  const showCours = course.hasCours ?? true; // Default to true for backward compatibility
  const showTD = course.hasTD ?? false;
  const showTP = course.hasTP ?? false;
  const showExam = course.hasExam ?? false;

  // Calculate grid layout based on visible sections
  const visibleSections = [showCours, showTD, showTP, showExam].filter(
    Boolean,
  ).length;
  const gridCols =
    visibleSections === 1
      ? "grid-cols-1"
      : visibleSections === 2
        ? "grid-cols-1 md:grid-cols-2"
        : visibleSections === 3
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/home" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link
          to={`/dashboard?level=${course.level}`}
          className="hover:text-primary transition-colors"
        >
          {getLevelName(course.level)}
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-slate-900 font-medium">{course.code}</span>
      </div>

      {/* Solution Lock Notice */}
      {!areSolutionsUnlocked &&
        globalExamDate &&
        examSettingsEnabled &&
        (tdSeries.some((s) => s.hasSolution) ||
          tpSeries.some((s) => s.hasSolution) ||
          pwSeries.some((s) => s.hasSolution)) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl">
              lock
            </span>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-1">
                Solutions Locked
              </h3>
              <p className="text-sm text-amber-700">
                TD/TP solutions will unlock automatically on{" "}
                <span className="font-bold">{getUnlockDateMessage()}</span> when
                the exam period begins.
              </p>
            </div>
          </div>
        )}

      {/* Solutions Unlocked Notice */}
      {areSolutionsUnlocked &&
        globalExamDate &&
        examSettingsEnabled &&
        (tdSeries.some((s) => s.hasSolution) ||
          tpSeries.some((s) => s.hasSolution) ||
          pwSeries.some((s) => s.hasSolution)) && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-green-600 text-2xl">
              lock_open
            </span>
            <div className="flex-1">
              <h3 className="font-bold text-green-900 mb-1">
                Solutions Unlocked
              </h3>
              <p className="text-sm text-green-700">
                TD/TP solutions are now available for download.
              </p>
            </div>
          </div>
        )}

      {/* Header Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-start gap-6">
          <div
            className={`size-16 rounded-xl flex items-center justify-center ${course.color || "text-blue-600"}`}
            style={{
              backgroundColor: `${course.color?.replace("text-", "")}15`,
            }}
          >
            <span
              className={`material-symbols-outlined text-4xl ${course.color || "text-blue-600"}`}
            >
              {course.icon || "book"}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  course.type === "Core"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-purple-50 text-purple-600"
                }`}
              >
                {course.type}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                {getLevelName(course.level)}
              </span>
              <span className="text-slate-500 text-sm">
                Semester {course.semester}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {course.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">
                  person
                </span>
                {course.professor}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">
                  school
                </span>
                {course.credits} Credits
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  course.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : course.status === "Completed"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {course.status}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {course.status === "Active" && (
          <div className="mt-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-900">
                Course Progress
              </span>
              <span className="text-sm font-medium text-primary">
                {calculateProgress()}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Course and TD/TP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Chapters Card - Only show if enabled */}
        {showCours && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  library_books
                </span>
                Course Materials
              </h3>
              <div className="flex gap-2">
                {books.length > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                    {books.length} Book{books.length !== 1 ? 's' : ''}
                  </span>
                )}
                {chapters.length > 0 && (
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                    {chapters.length} Ch
                  </span>
                )}
              </div>
            </div>

            {(books.length > 0 || chapters.length > 0) ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Full Course Books Section */}
                {books.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-purple-600 uppercase tracking-wider px-2 border-b border-purple-200 pb-2">
                      📚 Full Course Books
                    </h4>
                    {books.map((resource) => (
                      <div
                        key={resource.id}
                        onClick={() => openDriveUrl(resource.driveUrl, resource.title, resource.id, 'chapter')}
                        className="group p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 hover:border-purple-300 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="size-10 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 relative">
                            📚
                            {courseProgress.viewedChapters.has(resource.id) && (
                              <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[12px]">check</span>
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 mb-1">
                              {resource.title}
                            </h4>
                            {resource.description && (
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {resource.description}
                              </p>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-purple-400 group-hover:text-purple-600 transition-colors">
                            open_in_new
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Individual Chapters Section */}
                {chapters.length > 0 && (
                  <div className="space-y-2">
                    {books.length > 0 && (
                      <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider px-2 border-b border-blue-200 pb-2 mt-4">
                        📄 Individual Chapters
                      </h4>
                    )}
                    {chapters.map((resource) => (
                  <div
                    key={resource.id}
                    onClick={() => openDriveUrl(resource.driveUrl, `Chapter ${resource.chapterNumber}: ${resource.title}`, resource.id, 'chapter')}
                    className="group p-4 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 relative">
                        {resource.chapterNumber}
                        {courseProgress.viewedChapters.has(resource.id) && (
                          <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[12px]">check</span>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                          {resource.title}
                        </h4>
                        {resource.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                        open_in_new
                      </span>
                    </div>
                  </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-2">
                  library_books
                </span>
                <p className="text-sm">No materials available</p>
              </div>
            )}
          </div>
        )}

        {/* TD/TP Combined Column */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                groups
              </span>
              TD / TP
            </h3>
            <div className="flex gap-2">
              {showTD && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  {tdSeries.length} TD
                </span>
              )}
              {showTP && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {tpSeries.length} TP
                </span>
              )}
              {showTP && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  {pwSeries.length} PW
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {/* TD Section */}
            {showTD && tdSeries.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider px-2">
                  Travaux Dirigés
                </h4>
                {tdSeries.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {formatTitle(item.title)}
                      </h4>
                      <div className="flex items-center gap-2">
                        {!item.driveUrl && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            No file
                          </span>
                        )}
                        {item.hasSolution && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">
                              check_circle
                            </span>
                            Has Solution
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {item.date && !isNaN(new Date(item.date).getTime())
                        ? new Date(item.date).toLocaleDateString()
                        : 'Date not available'}
                    </p>
                    <div className="flex gap-2">
                      {/* TD File Button - Always visible */}
                      <button
                        onClick={() => item.driveUrl && openDriveUrl(item.driveUrl, item.title, item.id, 'TD')}
                        disabled={!item.driveUrl}
                        className={`flex-1 px-3 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 relative ${
                          item.driveUrl
                            ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                            : 'bg-slate-400 cursor-not-allowed opacity-70'
                        }`}
                        title={item.driveUrl ? 'Download TD file' : 'PDF not found - No attachment available'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {item.driveUrl ? 'download' : 'block'}
                        </span>
                        TD File
                        {item.driveUrl && courseProgress.viewedTD.has(item.id) && (
                          <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[10px]">check</span>
                          </span>
                        )}
                      </button>

                      {/* Solution Button - Always visible */}
                      <button
                        onClick={() => {
                          if (item.hasSolution && item.solutionUrl && areSolutionsUnlocked) {
                            openDriveUrl(item.solutionUrl, `${item.title} - Solution`, item.id, 'TD');
                          }
                        }}
                        disabled={!item.hasSolution || !item.solutionUrl || !areSolutionsUnlocked}
                        className={`flex-1 px-3 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          item.hasSolution && item.solutionUrl && areSolutionsUnlocked
                            ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                            : 'bg-slate-400 cursor-not-allowed opacity-70'
                        }`}
                        title={
                          !item.hasSolution
                            ? 'No solution available'
                            : !item.solutionUrl
                            ? 'Solution PDF not found - No attachment available'
                            : !areSolutionsUnlocked
                            ? `Solutions unlock on ${getUnlockDateMessage()}`
                            : 'Download solution'
                        }
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {item.hasSolution && item.solutionUrl && areSolutionsUnlocked ? 'lightbulb' : 
                           !areSolutionsUnlocked ? 'lock' : 'block'}
                        </span>
                        {areSolutionsUnlocked ? 'Solution' : 'Locked'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TP Section */}
            {showTP && tpSeries.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider px-2">
                  Travaux Pratiques
                </h4>
                {tpSeries.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 hover:bg-green-50 rounded-lg border border-slate-200 hover:border-green-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {formatTitle(item.title)}
                      </h4>
                      <div className="flex items-center gap-2">
                        {!item.driveUrl && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            No file
                          </span>
                        )}
                        {item.hasSolution && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">
                              check_circle
                            </span>
                            Has Solution
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {item.date && !isNaN(new Date(item.date).getTime())
                        ? new Date(item.date).toLocaleDateString()
                        : 'Date not available'}
                    </p>
                    <div className="flex gap-2">
                      {/* TP File Button - Always visible */}
                      <button
                        onClick={() => item.driveUrl && openDriveUrl(item.driveUrl, item.title, item.id, 'TP')}
                        disabled={!item.driveUrl}
                        className={`flex-1 px-3 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 relative ${
                          item.driveUrl
                            ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                            : 'bg-slate-400 cursor-not-allowed opacity-70'
                        }`}
                        title={item.driveUrl ? 'Download TP file' : 'PDF not found - No attachment available'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {item.driveUrl ? 'download' : 'block'}
                        </span>
                        TP File
                        {item.driveUrl && courseProgress.viewedTP.has(item.id) && (
                          <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[10px]">check</span>
                          </span>
                        )}
                      </button>

                      {/* Solution Button - Always visible */}
                      <button
                        onClick={() => {
                          if (item.hasSolution && item.solutionUrl && areSolutionsUnlocked) {
                            openDriveUrl(item.solutionUrl, `${item.title} - Solution`, item.id, 'TP');
                          }
                        }}
                        disabled={!item.hasSolution || !item.solutionUrl || !areSolutionsUnlocked}
                        className={`flex-1 px-3 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          item.hasSolution && item.solutionUrl && areSolutionsUnlocked
                            ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                            : 'bg-slate-400 cursor-not-allowed opacity-70'
                        }`}
                        title={
                          !item.hasSolution
                            ? 'No solution available'
                            : !item.solutionUrl
                            ? 'Solution PDF not found - No attachment available'
                            : !areSolutionsUnlocked
                            ? `Solutions unlock on ${getUnlockDateMessage()}`
                            : 'Download solution'
                        }
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {item.hasSolution && item.solutionUrl && areSolutionsUnlocked ? 'lightbulb' : 
                           !areSolutionsUnlocked ? 'lock' : 'block'}
                        </span>
                        {areSolutionsUnlocked ? 'Solution' : 'Locked'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PW Section */}
            {showTP && pwSeries.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider px-2">
                  Practical Work
                </h4>
                {pwSeries.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 hover:bg-amber-50 rounded-lg border border-slate-200 hover:border-amber-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {formatTitle(item.title)}
                      </h4>
                      <div className="flex items-center gap-2">
                        {!item.driveUrl && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            No file
                          </span>
                        )}
                        {item.hasSolution && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">
                              check_circle
                            </span>
                            Has Solution
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {item.date && !isNaN(new Date(item.date).getTime())
                        ? new Date(item.date).toLocaleDateString()
                        : 'Date not available'}
                    </p>
                    <div className="flex gap-2">
                      {/* PW File Button - Always visible */}
                      <button
                        onClick={() => item.driveUrl && openDriveUrl(item.driveUrl, item.title, item.id, 'TP')}
                        disabled={!item.driveUrl}
                        className={`flex-1 px-3 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 relative ${
                          item.driveUrl
                            ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                            : 'bg-slate-400 cursor-not-allowed opacity-70'
                        }`}
                        title={item.driveUrl ? 'Download PW file' : 'PDF not found - No attachment available'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {item.driveUrl ? 'download' : 'block'}
                        </span>
                        PW File
                        {item.driveUrl && courseProgress.viewedTP.has(item.id) && (
                          <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[10px]">check</span>
                          </span>
                        )}
                      </button>

                      {/* Solution Button - Always visible */}
                      <button
                        onClick={() => {
                          if (item.hasSolution && item.solutionUrl && areSolutionsUnlocked) {
                            openDriveUrl(item.solutionUrl, `${item.title} - Solution`, item.id, 'TP');
                          }
                        }}
                        disabled={!item.hasSolution || !item.solutionUrl || !areSolutionsUnlocked}
                        className={`flex-1 px-3 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          item.hasSolution && item.solutionUrl && areSolutionsUnlocked
                            ? 'bg-yellow-600 hover:bg-yellow-700 cursor-pointer'
                            : 'bg-slate-400 cursor-not-allowed opacity-70'
                        }`}
                        title={
                          !item.hasSolution
                            ? 'No solution available'
                            : !item.solutionUrl
                            ? 'Solution PDF not found - No attachment available'
                            : !areSolutionsUnlocked
                            ? `Solutions unlock on ${getUnlockDateMessage()}`
                            : 'Download solution'
                        }
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {item.hasSolution && item.solutionUrl && areSolutionsUnlocked ? 'lightbulb' : 
                           !areSolutionsUnlocked ? 'lock' : 'block'}
                        </span>
                        {areSolutionsUnlocked ? 'Solution' : 'Locked'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {(!showTD || tdSeries.length === 0) && (!showTP || tpSeries.length === 0) && (!showTP || pwSeries.length === 0) && (
              <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-2">
                  folder_off
                </span>
                <p className="text-sm">No TD/TP/PW available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exams Section Below - Only show if there are valid exams */}
      {showExam && (examFinalSeries.length > 0 || examTDSeries.length > 0 || examTPSeries.length > 0 || examDevoirSeries.length > 0 || examRattrapageSeries.length > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">
                quiz
              </span>
              Exam Archives
            </h3>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
              {examFinalSeries.length + examTDSeries.length + examTPSeries.length + examDevoirSeries.length + examRattrapageSeries.length}
            </span>
          </div>

          {(examFinalSeries.length > 0 || examTDSeries.length > 0 || examTPSeries.length > 0 || examDevoirSeries.length > 0 || examRattrapageSeries.length > 0) ? (
            <div className="space-y-6 max-h-[600px] overflow-y-auto">
              {/* Final Exams Section */}
              {examFinalSeries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider px-2 border-b border-red-200 pb-2">
                    Final:
                  </h4>
                  {examFinalSeries.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {formatTitle(item.title)}
                        </h4>
                        <div className="flex items-center gap-2">
                          {!item.driveUrl && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">error</span>
                              No file
                            </span>
                          )}
                          {item.hasSolution && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">
                                check_circle
                              </span>
                              Has Solution
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {item.date && !isNaN(new Date(item.date).getTime())
                          ? new Date(item.date).toLocaleDateString()
                          : 'Date not available'}
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => item.driveUrl && openDriveUrl(item.driveUrl, item.title, item.id, 'exam')}
                          disabled={!item.driveUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 relative ${
                            item.driveUrl
                              ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={item.driveUrl ? 'Download exam' : 'PDF not found - No attachment available'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.driveUrl ? 'download' : 'block'}
                          </span>
                          Exam File
                          {item.driveUrl && courseProgress.viewedExams.has(item.id) && (
                            <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[10px]">check</span>
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (item.hasSolution && item.solutionUrl) {
                              openDriveUrl(item.solutionUrl, `${item.title} - Solution`, item.id, 'exam');
                            }
                          }}
                          disabled={!item.hasSolution || !item.solutionUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                            item.hasSolution && item.solutionUrl
                              ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={
                            !item.hasSolution
                              ? 'No solution available'
                              : !item.solutionUrl
                              ? 'Solution PDF not found - No attachment available'
                              : 'Download solution'
                          }
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.hasSolution && item.solutionUrl ? 'lightbulb' : 'block'}
                          </span>
                          Solution
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TD Exams Section */}
              {examTDSeries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider px-2 border-b border-blue-200 pb-2">
                    TD / Tutorial:
                  </h4>
                  {examTDSeries.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {formatTitle(item.title)}
                        </h4>
                        <div className="flex items-center gap-2">
                          {!item.driveUrl && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">error</span>
                              No file
                            </span>
                          )}
                          {item.hasSolution && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">
                                check_circle
                              </span>
                              Has Solution
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {item.date && !isNaN(new Date(item.date).getTime())
                          ? new Date(item.date).toLocaleDateString()
                          : 'Date not available'}
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => item.driveUrl && openDriveUrl(item.driveUrl, item.title, item.id, 'exam')}
                          disabled={!item.driveUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 relative ${
                            item.driveUrl
                              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={item.driveUrl ? 'Download exam' : 'PDF not found - No attachment available'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.driveUrl ? 'download' : 'block'}
                          </span>
                          Exam File
                          {item.driveUrl && courseProgress.viewedExams.has(item.id) && (
                            <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[10px]">check</span>
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (item.hasSolution && item.solutionUrl) {
                              openDriveUrl(item.solutionUrl, `${item.title} - Solution`, item.id, 'exam');
                            }
                          }}
                          disabled={!item.hasSolution || !item.solutionUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                            item.hasSolution && item.solutionUrl
                              ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={
                            !item.hasSolution
                              ? 'No solution available'
                              : !item.solutionUrl
                              ? 'Solution PDF not found - No attachment available'
                              : 'Download solution'
                          }
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.hasSolution && item.solutionUrl ? 'lightbulb' : 'block'}
                          </span>
                          Solution
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TP Exams Section */}
              {examTPSeries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider px-2 border-b border-green-200 pb-2">
                    TP / Lab:
                  </h4>
                  {examTPSeries.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 hover:bg-green-50 rounded-lg border border-slate-200 hover:border-green-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {formatTitle(item.title)}
                        </h4>
                        <div className="flex items-center gap-2">
                          {!item.driveUrl && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">error</span>
                              No file
                            </span>
                          )}
                          {item.hasSolution && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">
                                check_circle
                              </span>
                              Has Solution
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {item.date && !isNaN(new Date(item.date).getTime())
                          ? new Date(item.date).toLocaleDateString()
                          : 'Date not available'}
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => item.driveUrl && openDriveUrl(item.driveUrl, item.title, item.id, 'exam')}
                          disabled={!item.driveUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 relative ${
                            item.driveUrl
                              ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={item.driveUrl ? 'Download exam' : 'PDF not found - No attachment available'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.driveUrl ? 'download' : 'block'}
                          </span>
                          Exam File
                          {item.driveUrl && courseProgress.viewedExams.has(item.id) && (
                            <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[10px]">check</span>
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (item.hasSolution && item.solutionUrl) {
                              openDriveUrl(item.solutionUrl, `${item.title} - Solution`, item.id, 'exam');
                            }
                          }}
                          disabled={!item.hasSolution || !item.solutionUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                            item.hasSolution && item.solutionUrl
                              ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={
                            !item.hasSolution
                              ? 'No solution available'
                              : !item.solutionUrl
                              ? 'Solution PDF not found - No attachment available'
                              : 'Download solution'
                          }
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.hasSolution && item.solutionUrl ? 'lightbulb' : 'block'}
                          </span>
                          Solution
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rattrapage Exams Section */}
              {examRattrapageSeries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-orange-600 uppercase tracking-wider px-2 border-b border-orange-200 pb-2">
                    Rattrapage / Makeup:
                  </h4>
                  {examRattrapageSeries.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 hover:bg-orange-50 rounded-lg border border-slate-200 hover:border-orange-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {formatTitle(item.title)}
                        </h4>
                        <div className="flex items-center gap-2">
                          {!item.driveUrl && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">error</span>
                              No file
                            </span>
                          )}
                          {item.hasSolution && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">
                                check_circle
                              </span>
                              Has Solution
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {item.date && !isNaN(new Date(item.date).getTime())
                          ? new Date(item.date).toLocaleDateString()
                          : 'Date not available'}
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => item.driveUrl && openDriveUrl(item.driveUrl, item.title, item.id, 'exam')}
                          disabled={!item.driveUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 relative ${
                            item.driveUrl
                              ? 'bg-orange-600 hover:bg-orange-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={item.driveUrl ? 'Download exam' : 'PDF not found - No attachment available'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.driveUrl ? 'download' : 'block'}
                          </span>
                          Exam File
                          {item.driveUrl && courseProgress.viewedExams.has(item.id) && (
                            <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[10px]">check</span>
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (item.hasSolution && item.solutionUrl) {
                              openDriveUrl(item.solutionUrl, `${item.title} - Solution`, item.id, 'exam');
                            }
                          }}
                          disabled={!item.hasSolution || !item.solutionUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                            item.hasSolution && item.solutionUrl
                              ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={
                            !item.hasSolution
                              ? 'No solution available'
                              : !item.solutionUrl
                              ? 'Solution PDF not found - No attachment available'
                              : 'Download solution'
                          }
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.hasSolution && item.solutionUrl ? 'lightbulb' : 'block'}
                          </span>
                          Solution
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Devoir Exams Section */}
              {examDevoirSeries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-purple-600 uppercase tracking-wider px-2 border-b border-purple-200 pb-2">
                    Devoir:
                  </h4>
                  {examDevoirSeries.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 hover:bg-purple-50 rounded-lg border border-slate-200 hover:border-purple-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {formatTitle(item.title)}
                        </h4>
                        <div className="flex items-center gap-2">
                          {!item.driveUrl && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">error</span>
                              No file
                            </span>
                          )}
                          {item.hasSolution && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">
                                check_circle
                              </span>
                              Has Solution
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {item.date && !isNaN(new Date(item.date).getTime())
                          ? new Date(item.date).toLocaleDateString()
                          : 'Date not available'}
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => item.driveUrl && openDriveUrl(item.driveUrl, item.title, item.id, 'exam')}
                          disabled={!item.driveUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 relative ${
                            item.driveUrl
                              ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={item.driveUrl ? 'Download exam' : 'PDF not found - No attachment available'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.driveUrl ? 'download' : 'block'}
                          </span>
                          Exam File
                          {item.driveUrl && courseProgress.viewedExams.has(item.id) && (
                            <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[10px]">check</span>
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (item.hasSolution && item.solutionUrl) {
                              openDriveUrl(item.solutionUrl, `${item.title} - Solution`, item.id, 'exam');
                            }
                          }}
                          disabled={!item.hasSolution || !item.solutionUrl}
                          className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                            item.hasSolution && item.solutionUrl
                              ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                              : 'bg-slate-400 cursor-not-allowed opacity-70'
                          }`}
                          title={
                            !item.hasSolution
                              ? 'No solution available'
                              : !item.solutionUrl
                              ? 'Solution PDF not found - No attachment available'
                              : 'Download solution'
                          }
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.hasSolution && item.solutionUrl ? 'lightbulb' : 'block'}
                          </span>
                          Solution
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-2">
                quiz
              </span>
              <p className="text-sm">No exams available</p>
            </div>
          )}
        </div>
      )}

      {/* Secure PDF Viewer Modal */}
      {viewingPDF && (
        <SecurePDFViewer
          driveUrl={viewingPDF.url}
          title={viewingPDF.title}
          onClose={() => setViewingPDF(null)}
        />
      )}
    </div>
  );
};

export default CourseDetail;
