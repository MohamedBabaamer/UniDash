import React, { useState, useEffect } from "react";
import { Series, Course } from "../types";
import {
  getAllSeries,
  getAllCourses,
  createSeries,
  updateSeries,
  deleteSeries,
} from "../services/database.service";
import { generateSeriesDescription } from "../services/ai.service";

const AdminSeries: React.FC = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    type: "TD" as "TD" | "TP" | "Exam",
    driveUrl: "",
    solutionUrl: "",
    hasSolution: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log("🔄 AdminSeries: Starting to fetch data...");
    setLoading(true);
    try {
      console.log("📡 AdminSeries: Calling getAllSeries and getAllCourses...");
      const [seriesData, coursesData] = await Promise.all([
        getAllSeries(),
        getAllCourses(),
      ]);
      console.log(
        "✅ AdminSeries: Series fetched:",
        seriesData.length,
        "items",
      );
      console.log(
        "✅ AdminSeries: Courses fetched:",
        coursesData.length,
        "items",
      );
      setSeries(seriesData);
      setCourses(coursesData);
      if (coursesData.length > 0 && !formData.courseId) {
        setFormData((prev) => ({ ...prev, courseId: coursesData[0].id }));
      }
    } catch (error: any) {
      console.error("❌ AdminSeries: Error fetching data:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error code:", error.code);
      setNotification({
        type: "error",
        message: `Failed to load data: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedCourse = courses.find((c) => c.id === formData.courseId);

      const seriesData: any = {
        courseId: formData.courseId,
        title: formData.title,
        type: formData.type,
        driveUrl: formData.driveUrl,
        hasSolution: formData.hasSolution,
      };

      if (formData.hasSolution && formData.solutionUrl) {
        seriesData.solutionUrl = formData.solutionUrl;
      }

      if (selectedCourse?.academicYear) {
        seriesData.academicYear = selectedCourse.academicYear;
      }

      if (editingSeries) {
        await updateSeries(editingSeries.id!, seriesData);
        setSeries(
          series.map((s) =>
            s.id === editingSeries.id ? { ...s, ...seriesData } : s,
          ),
        );
        setNotification({
          type: "success",
          message: "Series updated successfully!",
        });
      } else {
        const newId = await createSeries(seriesData);
        setSeries([{ ...seriesData, id: newId } as Series, ...series]);
        setNotification({
          type: "success",
          message: "Series created successfully!",
        });
      }

      handleCloseModal();
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error("Error saving series:", error);
      setNotification({
        type: "error",
        message: error.message || "Failed to save series",
      });
    }
  };

  const handleEdit = (item: Series) => {
    setEditingSeries(item);
    setFormData({
      courseId: item.courseId,
      title: item.title,
      type: item.type,
      driveUrl: item.driveUrl,
      solutionUrl: item.solutionUrl || "",
      hasSolution: item.hasSolution,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this series?")) return;

    try {
      await deleteSeries(id);
      setSeries(series.filter((s) => s.id !== id));
      setNotification({
        type: "success",
        message: "Series deleted successfully!",
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error deleting series:", error);
      setNotification({ type: "error", message: "Failed to delete series" });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSeries(null);
    setGeneratingAI(false);
    setFormData({
      courseId: courses[0]?.id || "",
      title: "",
      type: "TD",
      driveUrl: "",
      solutionUrl: "",
      hasSolution: false,
    });
  };

  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      setNotification({ type: "error", message: "Please enter a title first" });
      return;
    }

    const selectedCourse = courses.find((c) => c.id === formData.courseId);
    if (!selectedCourse) {
      setNotification({
        type: "error",
        message: "Please select a course first",
      });
      return;
    }

    setGeneratingAI(true);
    try {
      const description = await generateSeriesDescription(
        formData.title,
        formData.type,
        selectedCourse.name,
      );
      setFormData({ ...formData, description });
      setNotification({
        type: "success",
        message: "Description generated successfully!",
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error("Error generating description:", error);
      setNotification({
        type: "error",
        message: error.message || "Failed to generate description",
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const filteredSeries = series
    .filter((item) => {
      const matchCourse =
        selectedCourseId === "all" || item.courseId === selectedCourseId;
      const matchType = filterType === "All" || item.type === filterType;
      return matchCourse && matchType;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  const getTypeColor = (type: string) => {
    switch (type) {
      case "TD":
        return "bg-blue-100 text-blue-700";
      case "TP":
        return "bg-green-100 text-green-700";
      case "Exam":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-slate-500">Loading series...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Manage Series
          </h1>
          <p className="text-slate-500 mt-1">
            Manage TD, TP, and Exam exercises with solutions
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Add New Series
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Filter by Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name} ({course.level}) - Prof. {course.professor}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="All">All Types</option>
              <option value="TD">TD (Travaux Dirigés)</option>
              <option value="TP">TP (Travaux Pratiques)</option>
              <option value="Exam">Exam</option>
            </select>
          </div>
        </div>
      </div>

      {/* Series Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {filteredSeries.length} Series Found
          </h2>
        </div>

        {filteredSeries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">
              assignment
            </span>
            <p>No series found. Click "Add New Series" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Solution
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSeries.map((item) => {
                  const course = courses.find((c) => c.id === item.courseId);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(item.type)}`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {course?.code || "N/A"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {course?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.hasSolution ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">
                              check_circle
                            </span>
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">
                              cancel
                            </span>
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {/* View File Button */}
                          <a
                            href={item.driveUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-lg transition-colors ${
                              item.driveUrl
                                ? 'text-green-600 hover:bg-green-50 cursor-pointer'
                                : 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-60'
                            }`}
                            title={item.driveUrl ? 'View File' : 'No file attachment - PDF not found'}
                            onClick={(e) => !item.driveUrl && e.preventDefault()}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {item.driveUrl ? 'folder_open' : 'block'}
                            </span>
                          </a>

                          {/* View Solution Button */}
                          <a
                            href={item.solutionUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-lg transition-colors ${
                              item.hasSolution && item.solutionUrl
                                ? 'text-purple-600 hover:bg-purple-50 cursor-pointer'
                                : 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-60'
                            }`}
                            title={
                              !item.hasSolution
                                ? 'No solution available'
                                : !item.solutionUrl
                                ? 'No solution attachment - PDF not found'
                                : 'View Solution'
                            }
                            onClick={(e) => (!item.hasSolution || !item.solutionUrl) && e.preventDefault()}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {item.hasSolution && item.solutionUrl ? 'lightbulb' : 'block'}
                            </span>
                          </a>

                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Series"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-[scaleIn_0.2s_ease-out] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-bold text-slate-900">
                {editingSeries ? "Edit Series" : "Add New Series"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Important Notice */}
            <div className="mx-6 mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600 text-2xl flex-shrink-0">
                  warning
                </span>
                <div>
                  <h4 className="font-bold text-red-900 mb-1">⚠️ IMPORTANT: Make Files Public!</h4>
                  <p className="text-sm text-red-800 mb-2">
                    Students will see "Sign in to Google" if files are not public.
                  </p>
                  <div className="text-xs text-red-700 space-y-1">
                    <p><strong>1.</strong> Open file in Google Drive</p>
                    <p><strong>2.</strong> Right-click → Share</p>
                    <p><strong>3.</strong> Change to <strong>"Anyone with the link"</strong></p>
                    <p><strong>4.</strong> Set permission to <strong>"Viewer"</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  >
                    <option value="">Select Course/Module</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name} ({course.level}) - Prof. {course.professor}
                      </option>
                    ))}
                  </select>
                  {formData.courseId &&
                    courses.find((c) => c.id === formData.courseId) && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <div className="font-bold text-slate-900 mb-1">
                          {
                            courses.find((c) => c.id === formData.courseId)
                              ?.code
                          }{" "}
                          -{" "}
                          {
                            courses.find((c) => c.id === formData.courseId)
                              ?.name
                          }{" "}
                          (
                          {
                            courses.find((c) => c.id === formData.courseId)
                              ?.level
                          }
                          ) -{" "}
                          {
                            courses.find((c) => c.id === formData.courseId)
                              ?.academicYear
                          }
                        </div>
                        <div className="text-slate-600">
                          Professor:{" "}
                          <span className="font-bold text-primary">
                            {
                              courses.find((c) => c.id === formData.courseId)
                                ?.professor
                            }
                          </span>
                          {" "}• Level:{" "}
                          {
                            courses.find((c) => c.id === formData.courseId)
                              ?.level
                          }{" "}
                          • Year:{" "}
                          {
                            courses.find((c) => c.id === formData.courseId)
                              ?.academicYear
                          }
                        </div>
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    >
                      <option value="TD">TD (Travaux Dirigés)</option>
                      <option value="TP">TP (Travaux Pratiques)</option>
                      <option value="Exam">Exam</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    autoFocus
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="e.g., TD1: Introduction to Algorithms"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <span className="material-symbols-outlined text-lg align-middle mr-1">
                      folder
                    </span>
                    Exercise/Exam File URL {!formData.hasSolution && "*"}
                  </label>
                  <input
                    type="url"
                    value={formData.driveUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, driveUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="https://drive.google.com/... (Optional if only solution)"
                    required={!formData.hasSolution}
                  />
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">
                        info
                      </span>
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-1">Important: Make file public</p>
                        <p>Right-click file → Share → Change to "Anyone with the link"</p>
                        <p className="mt-1 text-blue-600">This prevents login prompts for students</p>
                        <p className="mt-1 text-slate-600">Leave empty if you only have the solution</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="hasSolution"
                    checked={formData.hasSolution}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hasSolution: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <label
                    htmlFor="hasSolution"
                    className="text-sm font-bold text-slate-700 cursor-pointer"
                  >
                    Has Solution Available
                  </label>
                </div>

                {formData.hasSolution && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      <span className="material-symbols-outlined text-lg align-middle mr-1">
                        lightbulb
                      </span>
                      Solution Drive URL
                    </label>
                    <input
                      type="url"
                      value={formData.solutionUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          solutionUrl: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="https://drive.google.com/..."
                    />
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">
                          info
                        </span>
                        <p className="text-xs text-blue-800">
                          Also make solution file public (Anyone with the link)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0 bg-slate-50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingSeries ? "Update Series" : "Create Series"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Dialog */}
      {notification && (
        <div className="fixed top-4 right-4 z-[60] animate-[slideInRight_0.3s_ease-out]">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
              notification.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                notification.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {notification.type === "success" ? "check_circle" : "error"}
            </span>
            <p
              className={`font-semibold ${
                notification.type === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className={`ml-2 ${
                notification.type === "success"
                  ? "text-green-600 hover:text-green-800"
                  : "text-red-600 hover:text-red-800"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSeries;
