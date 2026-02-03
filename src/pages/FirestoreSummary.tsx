import React, { useEffect, useState } from 'react';
import AdminRoute from '../components/AdminRoute';
import { useAuth } from '../contexts/AuthContext';
import { getAllCourses, getAllSeries, getAllUsers, getAllPayments, getAllResources } from '../services/database.service';
import type { Course, Series, Resource } from '../types';

const FirestoreSummary: React.FC = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses'|'resources'|'series'|'users'|'payments'>('courses');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [c, r, s, u, p] = await Promise.all([
          getAllCourses(),
          getAllResources(),
          getAllSeries(),
          getAllUsers(),
          getAllPayments(),
        ]);
        setCourses(c);
        setResources(r);
        setSeries(s);
        setUsers(u);
        setPayments(p);
      } catch (err: any) {
        console.error('Error fetching Firestore summary:', err);
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Reset pagination/search when tab changes
  useEffect(() => {
    setSearchQuery('');
    setCurrentPage(1);
    // set default sort when tab changes
    const defaultSort = (() => {
      switch (activeTab) {
        case 'courses': return 'code';
        case 'resources': return 'chapterNumber';
        case 'series': return 'sequenceNumber';
        case 'users': return 'id';
        case 'payments': return 'id';
        default: return '';
      }
    })();
    setSortBy(defaultSort);
    setSortDir('asc');
  }, [activeTab]);

  const getActiveData = () => {
    switch (activeTab) {
      case 'courses': return courses;
      case 'resources': return resources;
      case 'series': return series;
      case 'users': return users;
      case 'payments': return payments;
      default: return [];
    }
  };

  const filterData = (data: any[]) => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item => JSON.stringify(item).toLowerCase().includes(q));
  };

  const activeData = filterData(getActiveData());
  const sortData = (data: any[]) => {
    if (!sortBy) return data;
    const sorted = [...data].sort((a: any, b: any) => {
      const va = a?.[sortBy];
      const vb = b?.[sortBy];
      if (va == null && vb == null) return 0;
      if (va == null) return -1;
      if (vb == null) return 1;
      // numeric compare when both are numbers
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      // date-like compare
      const da = new Date(va).getTime();
      const db = new Date(vb).getTime();
      if (!isNaN(da) && !isNaN(db)) return da - db;
      // fallback to string compare
      return String(va).localeCompare(String(vb));
    });
    return sortDir === 'asc' ? sorted : sorted.reverse();
  };
  const sortedData = sortData(activeData);
  const totalPages = Math.max(1, Math.ceil(activeData.length / pageSize));
  const pagedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCSV = (rows: any[], filename = `${activeTab}.csv`) => {
    if (!rows || rows.length === 0) return;
    const header = Object.keys(rows[0]).join(',') + '\n';
    const csv = header + rows.map(r => Object.values(r).map(v => `"${String(v ?? '')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h3 className="text-lg font-bold">Not authorized</h3>
        <p className="text-sm text-slate-500">This page is only available to administrators.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Firestore Summary</h2>
        <div className="flex gap-2">
          <button onClick={() => { setActiveTab('courses'); }} className={`px-3 py-1 rounded ${activeTab === 'courses' ? 'bg-primary text-white' : 'bg-slate-100'}`}>Courses ({courses.length})</button>
          <button onClick={() => { setActiveTab('resources'); }} className={`px-3 py-1 rounded ${activeTab === 'resources' ? 'bg-primary text-white' : 'bg-slate-100'}`}>Resources ({resources.length})</button>
          <button onClick={() => { setActiveTab('series'); }} className={`px-3 py-1 rounded ${activeTab === 'series' ? 'bg-primary text-white' : 'bg-slate-100'}`}>Series ({series.length})</button>
          <button onClick={() => { setActiveTab('users'); }} className={`px-3 py-1 rounded ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-slate-100'}`}>Users ({users.length})</button>
          <button onClick={() => { setActiveTab('payments'); }} className={`px-3 py-1 rounded ${activeTab === 'payments' ? 'bg-primary text-white' : 'bg-slate-100'}`}>Payments ({payments.length})</button>
        </div>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="bg-white border rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search current tab..." className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-2 border border-slate-200 rounded-lg text-sm">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }} className="px-2 py-2 border border-slate-200 rounded-lg text-sm">
              {/* options depend on tab - provide common fields and some tab-specific */}
              <option value="">Sort by</option>
              {activeTab === 'courses' && (
                <>
                  <option value="code">Code</option>
                  <option value="name">Name</option>
                  <option value="professor">Professor</option>
                </>
              )}
              {activeTab === 'resources' && (
                <>
                  <option value="chapterNumber">Chapter #</option>
                  <option value="title">Title</option>
                </>
              )}
              {activeTab === 'series' && (
                <>
                  <option value="sequenceNumber">Seq #</option>
                  <option value="title">Title</option>
                </>
              )}
              {activeTab === 'users' && (
                <>
                  <option value="email">Email</option>
                  <option value="displayName">Name</option>
                </>
              )}
              {activeTab === 'payments' && (
                <>
                  <option value="amount">Amount</option>
                  <option value="status">Status</option>
                </>
              )}
            </select>
            <button onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')} className="px-2 py-2 border border-slate-200 rounded text-sm">{sortDir === 'asc' ? 'Asc' : 'Desc'}</button>
            <button onClick={() => exportCSV(activeData, `${activeTab}_all.csv`)} className="px-3 py-2 bg-primary text-white rounded-lg text-sm">Export CSV (all)</button>
            <button onClick={() => exportCSV(pagedData, `${activeTab}_page${currentPage}.csv`)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm">Export CSV (page)</button>
          </div>
          <div className="text-sm text-slate-500">Showing {activeData.length} items • Page {currentPage}/{totalPages}</div>
        </div>
        {activeTab === 'courses' && (
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="px-2 py-2">Code</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Professor</th>
                <th className="px-2 py-2">Level</th>
                <th className="px-2 py-2">Year</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="px-2 py-2">{c.code}</td>
                  <td className="px-2 py-2">{c.name}</td>
                  <td className="px-2 py-2">{c.professor}</td>
                  <td className="px-2 py-2">{c.level}</td>
                  <td className="px-2 py-2">{c.academicYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'resources' && (
          <div>
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-2 py-2">Course ID</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Chapter#</th>
                  <th className="px-2 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-2">{r.courseId}</td>
                    <td className="px-2 py-2">{r.title}</td>
                    <td className="px-2 py-2">{r.chapterNumber}</td>
                    <td className="px-2 py-2">{r.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'series' && (
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="px-2 py-2">Course ID</th>
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Seq#</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="px-2 py-2">{s.courseId}</td>
                  <td className="px-2 py-2">{s.title}</td>
                  <td className="px-2 py-2">{s.type}</td>
                  <td className="px-2 py-2">{s.sequenceNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'users' && (
          <div>
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.map((u: any) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-2 py-2">{u.id}</td>
                    <td className="px-2 py-2">{u.displayName || u.name || '-'}</td>
                    <td className="px-2 py-2">{u.email}</td>
                    <td className="px-2 py-2">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.map((p: any) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-2 py-2">{p.id}</td>
                    <td className="px-2 py-2">{p.userId}</td>
                    <td className="px-2 py-2">{p.amount}</td>
                    <td className="px-2 py-2">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(1)} className="px-2 py-1 bg-slate-100 rounded">First</button>
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="px-2 py-1 bg-slate-100 rounded">Prev</button>
            <span className="px-2">Page {currentPage} / {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="px-2 py-1 bg-slate-100 rounded">Next</button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 bg-slate-100 rounded">Last</button>
          </div>
          <div className="text-sm text-slate-500">{pagedData.length} rows on this page</div>
        </div>
      </div>
    </div>
  );
};

export default FirestoreSummary;
